/**
 * Set each tutor's total session count to match the program's records.
 *
 * Reads scripts/data/session-counts.json ([{ lastName, firstName, totalSessions }]) and sets
 * pastSessionCount so that logged sessions + pastSessionCount = totalSessions. Logged
 * sessions are never removed.
 *
 * Usage:  node scripts/update-session-counts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Tutor = require('../server/model/tutor');
const Session = require('../server/model/session');
const { exactMatch } = require('../server/utils/regex');
const { readDataFile } = require('./lib/data');

async function main() {
  const desiredCounts = readDataFile('session-counts.json');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let updated = 0;
  let skipped = 0;
  const notFound = [];

  for (const { lastName, firstName, totalSessions } of desiredCounts) {
    // Case-insensitive match to handle minor whitespace / casing differences
    const tutor = await Tutor.findOne({
      tutorLastName: exactMatch(lastName),
      tutorFirstName: exactMatch(firstName),
    });

    if (!tutor) {
      notFound.push(`${lastName}, ${firstName}`);
      continue;
    }

    // Only sessions that were actually logged on the site count as logged
    const loggedSessions = await Session.countDocuments({ _id: { $in: tutor.sessionHistory } });
    const pastSessionCount = Math.max(0, totalSessions - loggedSessions);

    if (tutor.pastSessionCount === pastSessionCount) {
      console.log(`  ✓ ${lastName}, ${firstName} — already at ${totalSessions}`);
      skipped++;
      continue;
    }

    await Tutor.updateOne({ _id: tutor._id }, { pastSessionCount });
    console.log(
      `  ✏ ${lastName}, ${firstName} — ${loggedSessions} logged + ${pastSessionCount} earlier`
    );
    updated++;
  }

  console.log('\n── Summary ──');
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped} (already correct)`);
  if (notFound.length) {
    console.log(`  Not found (${notFound.length}):`);
    notFound.forEach(n => console.log(`    • ${n}`));
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
