/**
 * One-time migration: the old update-session-counts script padded Tutor.sessionHistory
 * with made-up ObjectIds to raise session totals. This removes every sessionHistory entry
 * that doesn't point to a real Session and adds that many to pastSessionCount instead, so
 * each tutor's total stays the same. Safe to run more than once.
 *
 * Usage:  node scripts/migrate-session-padding.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Tutor = require('../server/model/tutor');
const Session = require('../server/model/session');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let migrated = 0;
  const tutors = await Tutor.find({ 'sessionHistory.0': { $exists: true } });

  for (const tutor of tutors) {
    const realIds = await Session.distinct('_id', { _id: { $in: tutor.sessionHistory } });
    const realIdSet = new Set(realIds.map(String));
    const placeholderIds = tutor.sessionHistory.filter(id => !realIdSet.has(String(id)));
    if (placeholderIds.length === 0) continue;

    await Tutor.updateOne(
      { _id: tutor._id },
      {
        $pull: { sessionHistory: { $in: placeholderIds } },
        $inc: { pastSessionCount: placeholderIds.length },
      }
    );
    console.log(
      `  ✏ ${tutor.tutorLastName}, ${tutor.tutorFirstName} — moved ${placeholderIds.length} to pastSessionCount`
    );
    migrated++;
  }

  console.log(`\nDone. Migrated ${migrated} tutor(s).`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
