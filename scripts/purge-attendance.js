/**
 * One-time script to reset all tutor attendance (days missed) to 0.
 * Usage: node scripts/purge-attendance.js
 */
const mongoose = require('mongoose');
require('dotenv').config();
const Tutor = require('../server/model/tutor');

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
