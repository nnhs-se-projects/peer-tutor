/**
 * Recalculate every tutor's days missed (Tutor.attendance) from the Attendance records,
 * using the same weights as the attendance page: absent +1, tardy +0.5, makeup −1.
 *
 * Pass --since YYYY-MM-DD to only count records from that date on (e.g. the first day of
 * the semester, after running purge-attendance.js).
 *
 * Usage:  node scripts/backfill-attendance.js [--since 2026-01-20]
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDB = require('../server/database/connection');
const Tutor = require('../server/model/tutor');
const Attendance = require('../server/model/attendanceSchema');
const { statusWeight } = require('../server/utils/attendance');
const { getAttendanceDayRange } = require('../server/utils/dates');

(async () => {
  const sinceIndex = process.argv.indexOf('--since');
  const since = sinceIndex === -1 ? null : process.argv[sinceIndex + 1];
  const sinceRange = since ? getAttendanceDayRange(since) : null;
  if (since && !sinceRange) {
    console.error('--since must be a date like 2026-01-20');
    process.exit(1);
  }

  await connectDB();

  // Tally days missed across the attendance records
  const tally = {}; // tutorID → net days missed

  const records = await Attendance.find(sinceRange ? { date: { $gte: sinceRange.start } } : {});
  console.log(`Processing ${records.length} attendance records…`);

  records.forEach(rec => {
    if (!Array.isArray(rec.tutors)) return;
    rec.tutors.forEach(t => {
      if (t.tutorId == null) return;
      tally[t.tutorId] = (tally[t.tutorId] || 0) + statusWeight(t.status);
    });
  });

  // Write back to each Tutor document. Tutors without any records go to 0.
  let updated = 0;
  const tutors = await Tutor.find();
  for (const tutor of tutors) {
    const daysMissed = tally[tutor.tutorID] || 0;
    if (tutor.attendance !== daysMissed) {
      await Tutor.updateOne({ _id: tutor._id }, { attendance: daysMissed });
      console.log(
        `  ✓ ${tutor.tutorFirstName} ${tutor.tutorLastName}: ${tutor.attendance} → ${daysMissed}`
      );
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} tutor(s).`);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
