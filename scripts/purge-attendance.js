/**
 * Reset every tutor's days missed to 0 (e.g. at the start of a semester).
 * Attendance records are kept; see backfill-attendance.js to recalculate from them.
 *
 * Usage: node scripts/purge-attendance.js --yes
 */
const mongoose = require('mongoose');
require('dotenv').config();
const Tutor = require('../server/model/tutor');

if (!process.argv.includes('--yes')) {
  console.log("This resets every tutor's days missed to 0. Run again with --yes to continue.");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await Tutor.updateMany({}, { $set: { attendance: 0 } });
    console.log(`Purged attendance for ${result.modifiedCount} tutor(s). All set to 0.`);
  } catch (err) {
    console.error('Error purging attendance:', err);
  } finally {
    await mongoose.disconnect();
  }
})();
