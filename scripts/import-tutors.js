/**
 * Import peer tutor data from CSV attendance sheets into MongoDB.
 *
 * Reads the S2 Period 4, 5, and 6 CSV files and the tutor email list from
 * scripts/data/, then upserts Tutor documents (by student ID) and Attendance
 * records so the pilot launch has full historical data.
 *
 * Running it again resets each tutor's days missed to the CSV totals, but never
 * changes a tutor's role.
 *
 * Usage:  node scripts/import-tutors.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Tutor = require('../server/model/tutor');
const Attendance = require('../server/model/attendanceSchema');
const { DATA_DIR, loadTutorEmails } = require('./lib/data');

/* ═══════════════════  configuration  ═══════════════════ */

const YEAR = 2026; // school-year calendar year for S2 dates

const CSV_DIR = DATA_DIR;

const CSV_FILES = [
  { filename: '2026 Peer Tutors - S2 Period 4.csv', period: 4 },
  { filename: '2026 Peer Tutors - S2 Period 5.csv', period: 5 },
  { filename: '2026 Peer Tutors - S2 Period 6.csv', period: 6 },
];

/** Map single-letter day abbreviations (CSV headers) → full names used in the app */
const DAY_ABBREV = {
  M: 'Monday',
  T: 'Tuesday',
  W: 'Wednesday',
  Th: 'Thursday',
  F: 'Friday',
};

/* ═══════════════════  email lookup  ═══════════════════ */

// Key format: "lastname|firstname" (lowercased). All emails lowercased per project convention.
const EMAIL_MAP = loadTutorEmails();

/* ═══════════════════  helpers  ═══════════════════ */

/**
 * Parse a raw attendance-cell value into one of the three schema statuses.
 * Priority: makeup (MUF) annotations → present (starts w/ P) → absent.
 * Returns null for empty / unrecognised cells (skipped during import).
 */
function parseStatus(raw) {
  const v = (raw || '').trim().toLowerCase();
  if (!v) return null;

  // Makeup indicators: "MUF 2/6", "m/u/f 1/27", "m/uf/ 2/4", "TARDY MUF 2/2"
  if (v.includes('muf') || v.includes('m/u/f') || v.includes('m/uf/')) return 'makeup';

  // Present: "P", ":P" (typo), "P future mu"
  if (/^:?p/i.test(v)) return 'present';

  // Absent: "A", "A- TARDY", "    A", standalone TARDY
  if (v.startsWith('a') || v.includes('tardy')) return 'absent';

  return null;
}

/**
 * Turn a header date string like "1/20" into a JS Date for the given year.
 */
function parseDate(dateStr) {
  const [month, day] = dateStr.split('/').map(Number);
  return new Date(YEAR, month - 1, day);
}

/**
 * Read a CSV file and return structured rows + the list of date-column indices.
 */
function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''); // strip BOM
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], dateColumns: [] };

  const headers = lines[0].split(',');

  // Identify which columns hold date headers (pattern: "M/D")
  const dateColumns = [];
  headers.forEach((h, i) => {
    if (/^\d{1,2}\/\d{1,2}$/.test(h.trim())) {
      dateColumns.push({ index: i, dateStr: h.trim() });
    }
  });

  // Identify day-of-week columns (M, T, W, Th, F)
  const dayColumns = {};
  headers.forEach((h, i) => {
    const t = h.trim();
    if (DAY_ABBREV[t]) dayColumns[t] = i;
  });

  const rows = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(',');
    const lastName = (cols[0] || '').trim();
    const firstName = (cols[1] || '').trim();
    const id = parseInt(cols[2], 10);

    // Skip empty rows, summary rows, etc.
    if (!lastName || !firstName || isNaN(id)) continue;

    const grade = parseInt(cols[3], 10);
    const returning = (cols[4] || '').trim().toUpperCase() === 'R';

    // Build days-available array using full names
    const daysAvailable = [];
    for (const [abbr, colIdx] of Object.entries(dayColumns)) {
      if ((cols[colIdx] || '').trim() === '1') {
        daysAvailable.push(DAY_ABBREV[abbr]);
      }
    }

    // Collect per-date attendance entries
    const attendance = [];
    for (const { index, dateStr } of dateColumns) {
      const status = parseStatus(cols[index]);
      if (status) attendance.push({ dateStr, status });
    }

    rows.push({
      lastName,
      firstName,
      id,
      grade,
      returning,
      daysAvailable,
      attendance,
    });
  }

  return { rows, dateColumns };
}

/* ═══════════════════  main  ═══════════════════ */

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    let tutorsUpserted = 0;
    let tutorsSkipped = 0;
    let attendanceDays = 0;

    // Accumulate attendance across all CSVs:  "YYYY-MM-DD|period" → { date, period, tutors[] }
    const attendanceMap = new Map();

    for (const { filename, period } of CSV_FILES) {
      const filePath = path.join(CSV_DIR, filename);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠  CSV not found – skipping: ${filePath}`);
        continue;
      }

      console.log(`── Period ${period}  (${filename}) ──`);
      const { rows } = parseCSV(filePath);

      for (const row of rows) {
        const key = `${row.lastName.toLowerCase()}|${row.firstName.toLowerCase()}`;
        const email = EMAIL_MAP.get(key);

        if (!email) {
          console.warn(
            `  ⚠  No email for "${row.firstName} ${row.lastName}" (ID ${row.id}) – skipped`
          );
          tutorsSkipped++;
          continue;
        }

        // Net absences = raw absences − makeups (min 0)
        const absences = row.attendance.filter(a => a.status === 'absent').length;
        const makeups = row.attendance.filter(a => a.status === 'makeup').length;
        const netAbsences = Math.max(0, absences - makeups);

        // Upsert the Tutor document (matched on unique student ID)
        await Tutor.findOneAndUpdate(
          { tutorID: row.id },
          {
            $set: {
              tutorFirstName: row.firstName,
              tutorLastName: row.lastName,
              tutorID: row.id,
              email,
              grade: row.grade,
              returning: row.returning,
              lunchPeriod: period,
              daysAvailable: row.daysAvailable,
              attendance: netAbsences,
            },
            // Only set for new tutors, so re-running never demotes a lead or admin
            $setOnInsert: {
              role: 'tutor',
              isActive: true,
              tutorLeader: false,
              classes: [],
              sessionHistory: [],
            },
          },
          { upsert: true, new: true }
        );
        tutorsUpserted++;
        console.log(
          `  ✓  ${row.firstName} ${row.lastName}  →  ${email}  (grade ${row.grade}, ${row.daysAvailable.join('/')}, absences: ${netAbsences})`
        );

        // Accumulate attendance entries by date + period
        for (const { dateStr, status } of row.attendance) {
          const date = parseDate(dateStr);
          const mapKey = `${date.toISOString().slice(0, 10)}|${period}`;

          if (!attendanceMap.has(mapKey)) {
            attendanceMap.set(mapKey, { date, period, tutors: [] });
          }
          attendanceMap.get(mapKey).tutors.push({
            tutorId: row.id,
            tutorFirstName: row.firstName,
            tutorLastName: row.lastName,
            email,
            status,
          });
        }
      }

      console.log();
    }

    // ── Upsert Attendance documents ──
    console.log('Writing attendance records…');
    for (const [, record] of attendanceMap) {
      await Attendance.findOneAndUpdate(
        { date: record.date, lunchPeriod: record.period },
        { $set: { tutors: record.tutors } },
        { upsert: true }
      );
      attendanceDays++;
    }

    console.log('\n══════════════════════════════════');
    console.log(`  Tutors upserted  : ${tutorsUpserted}`);
    console.log(`  Tutors skipped   : ${tutorsSkipped}`);
    console.log(`  Attendance days  : ${attendanceDays}`);
    console.log('══════════════════════════════════\n');
  } catch (err) {
    console.error('Import failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
})();
