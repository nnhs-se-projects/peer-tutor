/**
 * Import script: Peer Tutor Google Sheets CSV → MongoDB
 *
 * Handles TWO CSV formats (auto-detected from headers):
 *
 * ── FORMAT 1: Attendance sheets ─────────────────────────────────────────
 *   Filename:  "… 2026 Peer Tutors - S2 Period 4.csv"
 *   Layout:    LAST | FIRST | ID | Grade | N/R | (blank) | M T W Th F | (blank) | date cols…
 *   Creates:   Tutor docs + Attendance docs (grouped by date + period)
 *
 * ── FORMAT 2: Tutor Expertise sheets ────────────────────────────────────
 *   Filename:  "… Peer Tutors - Tutor Expertise.csv"
 *   Layout:    LAST | FIRST NAME | G | N/V | LUNCH | MATH | SCIENCE | ENGLISH |
 *              HISTORY | WORLD LANGUAGE | ELECTIVE | DAYS
 *   Creates:   Tutor docs (with classes populated) or updates existing tutors' classes
 *
 * Usage:
 *   1. Export each Google Sheet tab as .csv into  scripts/data/
 *   2. Run:  node scripts/import-from-csv.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../server/database/connection');

// ── Models ──────────────────────────────────────────────────────────────────
const Tutor = require('../server/model/tutor');
const Attendance = require('../server/model/attendanceSchema');

// ── Config ──────────────────────────────────────────────────────────────────
const CSV_DIR = path.join(__dirname, 'data');

// Map short day abbreviations (used in both CSV formats) to full day names
const DAY_HEADER_MAP = {
  M: 'Monday',
  T: 'Tuesday',
  W: 'Wednesday',
  Th: 'Thursday',
  TH: 'Thursday',
  F: 'Friday',
};

// ── CSV Parser ──────────────────────────────────────────────────────────────

/**
 * Parse a CSV file, handling quoted fields that contain commas.
 * Returns { headers: string[], rows: string[][] }
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const parseLine = line => {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  };

  const allLines = lines.map(parseLine);
  return { headers: allLines[0] || [], rows: allLines.slice(1) };
}

// ── Filename parser ─────────────────────────────────────────────────────────

/**
 * Extract the lunch period and year from the CSV filename.
 *   "TEST VERSION 2026 Peer Tutors - S2 Period 4.csv"
 *     → { lunchPeriod: 4, year: 2026 }
 */
function parseFilename(filePath) {
  const basename = path.basename(filePath, '.csv');

  // Extract period number  (e.g. "Period 4", "Period4", "P4")
  const periodMatch = basename.match(/Period\s*(\d+)/i);
  const lunchPeriod = periodMatch ? Number(periodMatch[1]) : null;

  // Extract year (4-digit number starting with 20)
  const yearMatch = basename.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();

  if (!lunchPeriod) {
    console.warn(
      `  ⚠ Could not detect lunch period from filename "${basename}". Defaulting to 0.`
    );
  }

  return { lunchPeriod: lunchPeriod || 0, year };
}

// ── Column layout detection ─────────────────────────────────────────────────

/**
 * Analyze the header row to identify:
 *   • dayColumns  — indices of the M / T / W / Th / F availability columns
 *   • dateColumns — indices of date columns (e.g. "1/20") with their parsed Date
 *
 * Blank separator columns are ignored automatically.
 */
function analyzeHeaders(headers, year) {
  const dayColumns = []; // { index, dayLetter, dayName }
  const dateColumns = []; // { index, date: Date }

  // Fixed columns: 0=LAST NAME, 1=FIRST NAME, 2=ID, 3=Y, 4=N/R
  // Everything after index 4 is either a day column, a date column, or blank.

  for (let i = 5; i < headers.length; i++) {
    const h = headers[i].trim();
    if (!h) continue; // blank separator column

    // Day-of-week availability column?
    if (DAY_HEADER_MAP[h]) {
      dayColumns.push({ index: i, dayLetter: h, dayName: DAY_HEADER_MAP[h] });
      continue;
    }

    // Date column like "1/20" or "2/3"?
    const dateMatch = h.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (dateMatch) {
      const month = Number(dateMatch[1]);
      const day = Number(dateMatch[2]);
      const date = new Date(year, month - 1, day); // month is 0-indexed in JS
      if (!isNaN(date.getTime())) {
        dateColumns.push({ index: i, date });
      }
    }
  }

  return { dayColumns, dateColumns };
}

// ── Attendance status parser ────────────────────────────────────────────────

/**
 * Normalize a raw cell value into an attendance status string.
 *
 *   "P"                      → "present"
 *   "A" / "    A"            → "absent"
 *   "m/u/f" / "muf" / "MUF" → "makeup"   (may include a trailing date like "m/u/f 1/22")
 *   "" / blank               → null       (tutor is not scheduled that day)
 */
function parseStatus(raw) {
  const val = (raw || '').trim().toLowerCase();
  if (!val) return null; // not scheduled that day — skip

  if (val === 'p') return 'present';
  if (val === 'a') return 'absent';
  if (val.startsWith('m/u/f') || val.startsWith('muf') || val.startsWith('m/u')) {
    return 'makeup';
  }

  // Unknown value — warn but treat as present
  console.warn(`    ⚠ Unknown attendance value "${raw.trim()}" — treating as present`);
  return 'present';
}

// ── CSV Type Detection ──────────────────────────────────────────────────────

/**
 * Auto-detect the CSV type from its header row.
 *   • "expertise" — has FIRST NAME, G, LUNCH, MATH columns
 *   • "attendance" — has ID column + date columns like 1/20
 */
function detectCSVType(headers) {
  const upper = headers.map(h => h.trim().toUpperCase());

  // Expertise sheets have "FIRST NAME" and subject columns like "MATH"
  if (upper.includes('FIRST NAME') && upper.includes('MATH')) {
    return 'expertise';
  }

  // Attendance sheets have an "ID" column (position 2) and date-format columns
  const hasDateCols = headers.some(h => /^\d{1,2}\/\d{1,2}$/.test(h.trim()));
  if (hasDateCols) {
    return 'attendance';
  }

  return 'unknown';
}

// ── Day string parser ───────────────────────────────────────────────────────

/**
 * Parse a comma-separated day string like "T, Th, F" into full day names.
 *   "M, W, F" → ["Monday", "Wednesday", "Friday"]
 *   "T,W,Th"  → ["Tuesday", "Wednesday", "Thursday"]
 */
function parseDaysString(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map(d => d.trim())
    .filter(Boolean)
    .map(
      abbr =>
        DAY_HEADER_MAP[abbr] || DAY_HEADER_MAP[abbr.charAt(0).toUpperCase() + abbr.slice(1)] || abbr
    )
    .filter(Boolean);
}

// ── Expertise CSV import ────────────────────────────────────────────────────

/**
 * Import a "Tutor Expertise" CSV.
 *
 * Layout:
 *   Col 0: (blank header) — LAST NAME
 *   Col 1: FIRST NAME
 *   Col 2: G  — grade
 *   Col 3: N/V — N=new, R=returning, V=veteran (treated as returning)
 *   Col 4: LUNCH — lunch period
 *   Col 5: MATH
 *   Col 6: SCIENCE
 *   Col 7: ENGLISH
 *   Col 8: HISTORY
 *   Col 9: WORLD LANGUAGE
 *   Col 10: ELECTIVE
 *   Col 11: DAYS — e.g. "T, Th"
 *
 * Each subject column contains a comma-separated list of classes.
 * All subject columns are merged into a single `classes` array on the Tutor doc.
 *
 * If a Tutor already exists (matched by first+last name), their `classes` and
 * `daysAvailable` are updated. Otherwise a new Tutor is created (without an ID
 * since this sheet doesn't have one — the attendance sheet import fills that in).
 */
async function importExpertise(filePath) {
  console.log(`\n📂 Processing (Expertise): ${path.basename(filePath)}`);

  const { headers, rows } = parseCSV(filePath);

  // Build a column index map from headers so we're resilient to column reordering
  const upper = headers.map(h => h.trim().toUpperCase());
  const colIdx = {
    lastName: 0, // first column is always last name (blank header)
    firstName: upper.indexOf('FIRST NAME'),
    grade: upper.indexOf('G'),
    nv: upper.indexOf('N/V'),
    lunch: upper.indexOf('LUNCH'),
    math: upper.indexOf('MATH'),
    science: upper.indexOf('SCIENCE'),
    english: upper.indexOf('ENGLISH'),
    history: upper.indexOf('HISTORY'),
    worldLang: upper.indexOf('WORLD LANGUAGE'),
    elective: upper.indexOf('ELECTIVE'),
    days: upper.indexOf('DAYS'),
  };

  // Subject columns whose values get merged into the `classes` array
  const subjectCols = ['math', 'science', 'english', 'history', 'worldLang', 'elective'];

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let rowsProcessed = 0;

  for (const cells of rows) {
    const lastName = (cells[colIdx.lastName] || '').trim();
    const firstName = colIdx.firstName >= 0 ? (cells[colIdx.firstName] || '').trim() : '';
    const gradeRaw = colIdx.grade >= 0 ? (cells[colIdx.grade] || '').trim() : '';
    const nvRaw = colIdx.nv >= 0 ? (cells[colIdx.nv] || '').trim().toUpperCase() : '';
    const lunchRaw = colIdx.lunch >= 0 ? (cells[colIdx.lunch] || '').trim() : '';

    // Skip empty / invalid rows
    if (!lastName || !firstName) continue;
    rowsProcessed++;

    const grade = Number(gradeRaw) || 0;
    const returning = nvRaw === 'R' || nvRaw === 'V'; // V (veteran) = returning
    const lunchPeriod = Number(lunchRaw) || 0;

    // ── Merge all subject columns into one classes array ─────────────
    const classes = [];
    for (const col of subjectCols) {
      const idx = colIdx[col];
      if (idx < 0) continue;
      const raw = (cells[idx] || '').trim();
      if (!raw) continue;
      // Split on commas, clean up each entry
      const items = raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      classes.push(...items);
    }

    // ── Days available ──────────────────────────────────────────────────
    const daysRaw = colIdx.days >= 0 ? (cells[colIdx.days] || '').trim() : '';
    const daysAvailable = parseDaysString(daysRaw);

    // ── Find or create tutor ────────────────────────────────────────────
    // Match by normalized first+last name (this CSV has no student ID)
    const existing = await Tutor.findOne({
      tutorFirstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, 'i') },
      tutorLastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, 'i') },
    });

    if (existing) {
      // Update classes and days on the existing tutor
      existing.classes = classes;
      if (daysAvailable.length > 0) existing.daysAvailable = daysAvailable;
      if (grade) existing.grade = grade;
      await existing.save();
      updated++;
    } else {
      // Create a new tutor (tutorID set to 0 as placeholder — attendance CSV fills it in)
      await Tutor.create({
        tutorFirstName: firstName,
        tutorLastName: lastName,
        tutorID: 0,
        email: '',
        grade,
        returning,
        lunchPeriod,
        daysAvailable,
        classes,
        tutorLeader: false,
        attendance: 0,
        sessionHistory: [],
      });
      created++;
    }
  }

  console.log(`   Processed ${rowsProcessed} tutor rows`);
  console.log(
    `   ✅ Tutors — created: ${created}, updated (classes): ${updated}, skipped: ${skipped}`
  );
}

/**
 * Escape special regex characters in a string for safe use in RegExp constructor.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Per-file import logic (Attendance) ──────────────────────────────────────

async function importAttendance(filePath) {
  console.log(`\n📂 Processing (Attendance): ${path.basename(filePath)}`);

  const { lunchPeriod, year } = parseFilename(filePath);
  console.log(`   Lunch Period: ${lunchPeriod}  |  Year: ${year}`);

  const { headers, rows } = parseCSV(filePath);
  const { dayColumns, dateColumns } = analyzeHeaders(headers, year);

  console.log(
    `   Detected ${dayColumns.length} day-of-week columns, ${dateColumns.length} date columns`
  );

  if (dateColumns.length > 0) {
    const first = dateColumns[0].date.toLocaleDateString();
    const last = dateColumns[dateColumns.length - 1].date.toLocaleDateString();
    console.log(`   Date range: ${first} → ${last}`);
  }

  // Attendance records grouped by date
  // key = "YYYY-MM-DD" → { date, lunchPeriod, tutors: [] }
  const attendanceByDate = {};

  let tutorsCreated = 0;
  let tutorsSkipped = 0;
  let rowsProcessed = 0;

  for (const cells of rows) {
    const lastName = (cells[0] || '').trim();
    const firstName = (cells[1] || '').trim();
    const idRaw = (cells[2] || '').trim();
    const gradeRaw = (cells[3] || '').trim();
    const nrRaw = (cells[4] || '').trim().toUpperCase();

    // Skip empty rows, summary rows, or rows without a valid numeric ID
    if (!lastName || !firstName || !idRaw || !/^\d+$/.test(idRaw)) continue;

    rowsProcessed++;
    const tutorID = Number(idRaw);
    const grade = Number(gradeRaw) || 0;
    const returning = nrRaw === 'R'; // R = returning, N = new

    // ── Days available (columns marked with "1") ────────────────────────
    const daysAvailable = [];
    for (const dc of dayColumns) {
      const val = (cells[dc.index] || '').trim();
      if (val === '1') {
        daysAvailable.push(dc.dayName);
      }
    }

    // ── Create Tutor if not already in DB ───────────────────────────────
    // First check by tutorID, then by name (expertise import may have
    // created the tutor without an ID)
    let existingTutor = await Tutor.findOne({ tutorID });
    if (!existingTutor) {
      // Check if expertise import created this tutor with tutorID: 0
      existingTutor = await Tutor.findOne({
        tutorFirstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, 'i') },
        tutorLastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, 'i') },
      });
    }

    if (!existingTutor) {
      await Tutor.create({
        tutorFirstName: firstName,
        tutorLastName: lastName,
        tutorID,
        email: '',
        grade,
        returning,
        lunchPeriod,
        daysAvailable,
        classes: [],
        tutorLeader: false,
        attendance: 0,
        sessionHistory: [],
      });
      tutorsCreated++;
    } else {
      // Update the tutorID if it was a placeholder 0 from expertise import
      if (existingTutor.tutorID === 0 && tutorID > 0) {
        existingTutor.tutorID = tutorID;
        existingTutor.lunchPeriod = lunchPeriod;
        await existingTutor.save();
        console.log(`      ↳ Filled in tutorID ${tutorID} for ${firstName} ${lastName}`);
      }
      tutorsSkipped++;
    }

    // ── Collect attendance entries per date ─────────────────────────────
    for (const dc of dateColumns) {
      const raw = cells[dc.index];
      const status = parseStatus(raw);
      if (!status) continue; // not scheduled that day — skip

      const key = dc.date.toISOString().split('T')[0];
      if (!attendanceByDate[key]) {
        attendanceByDate[key] = {
          date: dc.date,
          lunchPeriod,
          tutors: [],
        };
      }

      attendanceByDate[key].tutors.push({
        tutorId: tutorID,
        tutorFirstName: firstName,
        tutorLastName: lastName,
        email: '', // not in this CSV
        status,
      });
    }
  }

  console.log(`   Processed ${rowsProcessed} tutor rows`);
  console.log(
    `   ✅ Tutors  — created: ${tutorsCreated}, skipped (already exist): ${tutorsSkipped}`
  );

  // ── Write Attendance documents ──────────────────────────────────────────
  let attCreated = 0;
  let attSkipped = 0;

  const sortedDates = Object.keys(attendanceByDate).sort();
  for (const key of sortedDates) {
    const record = attendanceByDate[key];

    // Skip if an attendance doc for this date + period already exists
    const exists = await Attendance.findOne({
      date: record.date,
      lunchPeriod: record.lunchPeriod,
    });

    if (exists) {
      attSkipped++;
      continue;
    }

    await Attendance.create(record);
    attCreated++;
  }

  console.log(
    `   ✅ Attendance — created: ${attCreated} docs (${sortedDates.length} dates), skipped (existing): ${attSkipped}`
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Peer Tutor CSV → MongoDB Import\n');

  // Ensure data directory exists
  if (!fs.existsSync(CSV_DIR)) {
    fs.mkdirSync(CSV_DIR, { recursive: true });
    console.log(`📁 Created ${CSV_DIR}`);
    console.log('   Place your exported Google Sheets CSVs there and re-run.\n');
    process.exit(0);
  }

  // Find all CSV files in the data directory
  const csvFiles = fs
    .readdirSync(CSV_DIR)
    .filter(f => f.toLowerCase().endsWith('.csv'))
    .map(f => path.join(CSV_DIR, f));

  if (csvFiles.length === 0) {
    console.log('⚠  No CSV files found in scripts/data/');
    console.log('   Export your Google Sheets as .csv and place them there.\n');
    process.exit(0);
  }

  console.log(
    `Found ${csvFiles.length} CSV file(s):\n${csvFiles.map(f => '  • ' + path.basename(f)).join('\n')}`
  );

  await connectDB();

  // Classify each CSV by its header row
  const expertiseFiles = [];
  const attendanceFiles = [];
  const unknownFiles = [];

  for (const file of csvFiles) {
    const { headers } = parseCSV(file);
    const type = detectCSVType(headers);
    if (type === 'expertise') expertiseFiles.push(file);
    else if (type === 'attendance') attendanceFiles.push(file);
    else unknownFiles.push(file);
  }

  if (unknownFiles.length > 0) {
    console.warn(
      `\n⚠  Could not detect type for:\n${unknownFiles.map(f => '  • ' + path.basename(f)).join('\n')}`
    );
  }

  // Process expertise CSVs first so tutors exist before attendance links to them
  console.log(`\n── Expertise files: ${expertiseFiles.length} ──`);
  for (const file of expertiseFiles) {
    await importExpertise(file);
  }

  console.log(`\n── Attendance files: ${attendanceFiles.length} ──`);
  for (const file of attendanceFiles) {
    await importAttendance(file);
  }

  console.log('\n🏁 Import complete!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
