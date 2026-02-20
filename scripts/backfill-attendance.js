/**
 * Backfill tutor.attendance counters from existing Attendance records.
 *
 * The old logSubmission code saved Attendance documents but never updated
 * the Tutor.attendance counter.  This script tallies absent (+1) and
 * makeup (−1) statuses across ALL Attendance records and writes the
 * correct totals back to each Tutor document (clamped to 0 minimum).
 *
 * Run once:  node scripts/backfill-attendance.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDB = require('../server/database/connection');
const Tutor = require('../server/model/tutor');
const Attendance = require('../server/model/attendanceSchema');

(async () => {
  await connectDB();

  // Tally absent / makeup across every attendance record
  const tally = {}; // tutorID → net missed days

  const records = await Attendance.find();
  console.log(`Processing ${records.length} attendance records…`);

  records.forEach(rec => {
    if (!Array.isArray(rec.tutors)) return;
    rec.tutors.forEach(t => {
      const id = t.tutorId;
      if (id == null) return;
      if (!tally[id]) tally[id] = 0;
      if (t.status === 'absent') tally[id] += 1;
      if (t.status === 'makeup') tally[id] -= 1;
    });
  });

  console.log('\nComputed tallies:');
  for (const [id, count] of Object.entries(tally)) {
    const clamped = Math.max(0, count);
    console.log(`  tutorID ${id}: raw=${count}, clamped=${clamped}`);
  }

  // Write back to each Tutor document
  let updated = 0;
  for (const [id, count] of Object.entries(tally)) {
    const clamped = Math.max(0, count);
    const result = await Tutor.findOneAndUpdate(
      { tutorID: Number(id) },
      { attendance: clamped },
      { new: true }
    );
    if (result) {
      console.log(
        `  ✓ ${result.tutorFirstName} ${result.tutorLastName} → attendance=${result.attendance}`
      );
      updated++;
    } else {
      console.log(`  ✗ No tutor found with tutorID=${id}`);
    }
  }

  console.log(`\nDone. Updated ${updated} tutor(s).`);
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});

