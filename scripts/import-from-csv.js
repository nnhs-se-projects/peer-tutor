/**
 * Import script: Google Sheets CSV → MongoDB
 *
 * Usage:
 *   1. Export each Google Sheet tab as a .csv file into scripts/data/
 *   2. Update the CSV_FILES paths and COLUMN_MAP mappings below
 *   3. Run:  node scripts/import-from-csv.js
 *
 * This script will:
 *   - Parse each CSV
 *   - Create Tutor, Session, Tutee, and Attendance documents
 *   - Link Session ObjectIds into Tutor.sessionHistory and Tutee.sessionHistory
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../server/database/connection');

// ── Models ──────────────────────────────────────────────────────────────────
const Tutor = require('../server/model/tutor');
const Session = require('../server/model/session');
const Tutee = require('../server/model/tutee');
const Attendance = require('../server/model/attendanceSchema');

// ── CSV file paths (place your exported CSVs here) ──────────────────────────
const CSV_DIR = path.join(__dirname, 'data');
const CSV_FILES = {
  tutors: path.join(CSV_DIR, 'tutors.csv'),
  sessions: path.join(CSV_DIR, 'sessions.csv'),
  attendance: path.join(CSV_DIR, 'attendance.csv'),
};

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Minimal CSV parser (handles quoted fields with commas).
 * For production-grade parsing, consider `npm install csv-parse`.
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];

  const parseRow = line => {
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
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = parseRow(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

// ── Column Mappings ─────────────────────────────────────────────────────────
// TODO: Update these mappings to match YOUR Google Sheet column headers.
//       Left side  = your CSV column header (exactly as it appears)
//       Right side = the Mongoose schema field name
//
// Example: if your sheet has a column called "First Name", map it:
//   'First Name': 'tutorFirstName'

/**
 * TUTOR column mapping
 * Your tutor schema fields:
 *   tutorFirstName, tutorLastName, tutorID, email, grade,
 *   returning, lunchPeriod, daysAvailable (array), classes (array),
 *   tutorLeader, attendance, role, isActive
 */
const TUTOR_MAP = {
  // 'CSV Column Header': 'schemaField',
  'First Name': 'tutorFirstName',
  'Last Name': 'tutorLastName',
  'Student ID': 'tutorID',
  Email: 'email',
  Grade: 'grade',
  Returning: 'returning',
  'Lunch Period': 'lunchPeriod',
  'Days Available': 'daysAvailable', // e.g. "Monday, Wednesday, Friday"
  Classes: 'classes', // e.g. "Algebra 1, Geometry"
  'Tutor Leader': 'tutorLeader',
  Attendance: 'attendance',
};

/**
 * SESSION column mapping
 * Your session schema fields:
 *   tutorFirstName, tutorLastName, tutorID, sessionDate, sessionPeriod,
 *   sessionPlace, subject, class, teacher, focusOfSession,
 *   workAccomplished, tuteeFirstName, tuteeLastName, tuteeID, tuteeGrade
 */
const SESSION_MAP = {
  'Tutor First Name': 'tutorFirstName',
  'Tutor Last Name': 'tutorLastName',
  'Tutor ID': 'tutorID',
  Date: 'sessionDate',
  Period: 'sessionPeriod',
  Location: 'sessionPlace',
  Subject: 'subject',
  Class: 'class',
  Teacher: 'teacher',
  Focus: 'focusOfSession',
  'Work Accomplished': 'workAccomplished',
  'Tutee First Name': 'tuteeFirstName',
  'Tutee Last Name': 'tuteeLastName',
  'Tutee ID': 'tuteeID',
  'Tutee Grade': 'tuteeGrade',
};

/**
 * ATTENDANCE column mapping
 * Your attendance schema fields:
 *   date, lunchPeriod, tutors[] (array of { tutorId, tutorFirstName, tutorLastName, email, status })
 *
 * Attendance sheets are usually structured as one row per tutor per day:
 *   Date | Lunch Period | Tutor ID | First Name | Last Name | Email | Status
 */
const ATTENDANCE_MAP = {
  Date: 'date',
  'Lunch Period': 'lunchPeriod',
  'Tutor ID': 'tutorId',
  'First Name': 'tutorFirstName',
  'Last Name': 'tutorLastName',
  Email: 'email',
  Status: 'status', // present, absent, or makeup
};

// ── Transform helpers ───────────────────────────────────────────────────────

function mapRow(row, mapping) {
  const doc = {};
  for (const [csvCol, schemaField] of Object.entries(mapping)) {
    if (row[csvCol] !== undefined) {
      doc[schemaField] = row[csvCol];
    }
  }
  return doc;
}

function toBoolean(val) {
  if (typeof val === 'boolean') return val;
  const s = String(val).toLowerCase().trim();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y';
}

function toArray(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  return String(val)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function toDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// ── Import Functions ────────────────────────────────────────────────────────

async function importTutors() {
  if (!fs.existsSync(CSV_FILES.tutors)) {
    console.log('⏭  No tutors.csv found – skipping tutor import.');
    return;
  }

  const rows = parseCSV(CSV_FILES.tutors);
  console.log(`📄 Parsed ${rows.length} tutor rows from CSV`);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const data = mapRow(row, TUTOR_MAP);

    // Type conversions
    data.tutorID = Number(data.tutorID);
    data.grade = Number(data.grade);
    data.lunchPeriod = Number(data.lunchPeriod);
    data.attendance = Number(data.attendance) || 0;
    data.returning = toBoolean(data.returning);
    data.tutorLeader = toBoolean(data.tutorLeader);
    data.daysAvailable = toArray(data.daysAvailable);
    data.classes = toArray(data.classes);
    data.sessionHistory = [];

    // Skip if tutor already exists (by tutorID)
    const exists = await Tutor.findOne({ tutorID: data.tutorID });
    if (exists) {
      skipped++;
      continue;
    }

    await Tutor.create(data);
    created++;
  }

  console.log(`✅ Tutors — created: ${created}, skipped (duplicates): ${skipped}`);
}

async function importSessions() {
  if (!fs.existsSync(CSV_FILES.sessions)) {
    console.log('⏭  No sessions.csv found – skipping session import.');
    return;
  }

  const rows = parseCSV(CSV_FILES.sessions);
  console.log(`📄 Parsed ${rows.length} session rows from CSV`);

  let created = 0;
  let errors = 0;

  for (const row of rows) {
    const data = mapRow(row, SESSION_MAP);

    // Type conversions
    data.sessionDate = toDate(data.sessionDate);
    if (!data.sessionDate) {
      console.warn(`  ⚠ Skipping session with invalid date: "${row['Date']}"`);
      errors++;
      continue;
    }

    // Create the session
    const session = await Session.create(data);
    created++;

    // Link session to tutor's sessionHistory
    const tutor = await Tutor.findOne({ tutorID: Number(data.tutorID) || data.tutorID });
    if (tutor) {
      tutor.sessionHistory.push(session._id);
      await tutor.save();
    }

    // Link session to tutee (create tutee if needed)
    if (data.tuteeID) {
      let tutee = await Tutee.findOne({ tuteeID: Number(data.tuteeID) || data.tuteeID });
      if (!tutee) {
        tutee = await Tutee.create({
          tuteeID: Number(data.tuteeID) || 0,
          email: '', // Fill in if available in your sheet
          tuteeLastName: data.tuteeLastName || '',
          tuteeFirstName: data.tuteeFirstName || '',
          grade: Number(data.tuteeGrade) || 0,
          sessionHistory: [],
        });
      }
      // Embed the session sub-document into tutee's sessionHistory
      tutee.sessionHistory.push(session.toObject());
      await tutee.save();
    }
  }

  console.log(`✅ Sessions — created: ${created}, errors: ${errors}`);
}

async function importAttendance() {
  if (!fs.existsSync(CSV_FILES.attendance)) {
    console.log('⏭  No attendance.csv found – skipping attendance import.');
    return;
  }

  const rows = parseCSV(CSV_FILES.attendance);
  console.log(`📄 Parsed ${rows.length} attendance rows from CSV`);

  // Group rows by (date + lunchPeriod) since each Attendance doc holds many tutors
  const grouped = {};

  for (const row of rows) {
    const data = mapRow(row, ATTENDANCE_MAP);
    const dateVal = toDate(data.date);
    if (!dateVal) {
      console.warn(`  ⚠ Skipping attendance row with invalid date: "${row['Date']}"`);
      continue;
    }

    const lp = Number(data.lunchPeriod);
    const key = `${dateVal.toISOString().split('T')[0]}_${lp}`;

    if (!grouped[key]) {
      grouped[key] = { date: dateVal, lunchPeriod: lp, tutors: [] };
    }

    grouped[key].tutors.push({
      tutorId: Number(data.tutorId),
      tutorFirstName: data.tutorFirstName,
      tutorLastName: data.tutorLastName,
      email: data.email,
      status: (data.status || 'present').toLowerCase(),
    });
  }

  let created = 0;
  let skipped = 0;

  for (const record of Object.values(grouped)) {
    // Skip if this date+period combo already exists
    const exists = await Attendance.findOne({
      date: record.date,
      lunchPeriod: record.lunchPeriod,
    });
    if (exists) {
      skipped++;
      continue;
    }

    await Attendance.create(record);
    created++;
  }

  console.log(`✅ Attendance — created: ${created}, skipped (duplicates): ${skipped}`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting CSV → MongoDB import...\n');

  // Ensure the data directory exists
  if (!fs.existsSync(CSV_DIR)) {
    fs.mkdirSync(CSV_DIR, { recursive: true });
    console.log(`📁 Created ${CSV_DIR} — place your CSV files there and re-run.\n`);
    process.exit(0);
  }

  await connectDB();

  // Import order matters: tutors first, then sessions (which reference tutors)
  await importTutors();
  await importSessions();
  await importAttendance();

  console.log('\n🏁 Import complete!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
