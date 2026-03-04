/**
 * Update total session counts for tutors in MongoDB.
 *
 * Adjusts each tutor's sessionHistory array length to match the
 * desired total-sessions count. Pads with generated ObjectIds when
 * the current count is too low, or trims from the end when too high.
 *
 * Usage:  node scripts/update-session-counts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Tutor = require('../server/model/tutor');

/* ── desired total sessions per tutor (lastName, firstName → total) ── */
const TUTOR_SESSIONS = [
  ['Achtstatter', 'Lily', 1],
  ['Anderson', 'Grace', 1],
  ['Anderson', 'Kristen', 2],
  ['BenDror', 'Reggev', 4],
  ['Bhatia', 'Alaina', 10],
  ['Biggs', 'Sey', 0],
  ['Bourgeois', 'Luke', 4],
  ['Cao', 'Charlotte', 13],
  ['Che', 'Hannah', 6],
  ['Chiaramonte', 'Zachary', 58],
  ['Choudhary', 'Anaisha', 23],
  ['Coderre', 'Caroline', 30],
  ['Colburn', 'Erin', 7],
  ['Debnath', 'Anwita', 24],
  ['Domark', 'Luke', 36],
  ['Ferak', 'Mia', 23],
  ['Gao', 'Elizabeth', 8],
  ['Gao', 'Kyler', 3],
  ['Gaviria', 'Isaias', 1],
  ['Gokhale', 'Mihika', 17],
  ['Haiderali', 'Layla', 13],
  ['Hu', 'Melody', 30],
  ['Irawan', 'Aqra', 0],
  ['Iyengar', 'Amara', 2],
  ['Kang Chou', 'Elena', 11],
  ['Keane', 'Lucas', 19],
  ['Khan', 'Zayd', 19],
  ['Kitchel', 'Addison', 3],
  ['Kohli', 'Dhriti', 6],
  ['Konale', 'Tanuja', 20],
  ['Kwack', 'Jaslene', 16],
  ['Li', 'Evelyn', 11],
  ['Manikonda', 'Shresta', 3],
  ['Mantel', 'Tasha', 7],
  ['Martinson', 'Isabel', 37],
  ['Metzger', 'Harper', 0],
  ['Moungey', 'Madison', 1],
  ['Muck', 'Kitson', 40],
  ['Pamulapati', 'Varsha', 7],
  ['Pandya', 'Sophia', 37],
  ['Papa', 'Sadie', 30],
  ['Patel', 'Misri', 2],
  ['Photowala', 'Zain', 10],
  ['Photowala', 'Zoya', 30],
  ['Ragam', 'Vib', 36],
  ['Rea', 'Amy', 1],
  ['Rios', 'Mia', 47],
  ['Ruan', 'Michelle', 32],
  ['Sawant', 'Maehek', 49],
  ['Schaufenbuel', 'Katherine', 7],
  ['Schroetlin', 'Katie', 8],
  ['Self', 'Cameron', 23],
  ['Shah', 'Jasmine', 45],
  ['Shah', 'Jessica', 15],
  ['Shah', 'Sarina', 28],
  ['Shah', 'Vihan', 91],
  ['Shah', 'Abhi', 6],
  ['Shastry', 'Amogh', 7],
  ['Siska', 'David', 35],
  ['Siswick', 'Jake', 26],
  ['Sun', 'Paula', 23],
  ['Swatland', 'Juliette', 25],
  ['Swedberg', 'Liberty', 1],
  ['Swistak', 'Lucas', 29],
  ['Thotakura', 'Lakhi', 39],
  ['Tolia', 'Arushi', 80],
  ['Trivedi', 'Vivaan', 20],
  ['Wang', 'Andy', 1],
  ['Wang', 'Abby', 14],
  ['Wang', 'Anna', 52],
  ['Wang', 'Michelle', 27],
  ['Wikman', 'Peyton', 10],
  ['Yang', 'Jayden', 23],
  ['Zbiegiel', 'Richard', 15],
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let updated = 0;
  let skipped = 0;
  const notFound = [];

  for (const [lastName, firstName, desiredTotal] of TUTOR_SESSIONS) {
    // Case-insensitive regex match to handle minor whitespace / casing differences
    const tutor = await Tutor.findOne({
      tutorLastName: new RegExp(`^\\s*${escapeRegex(lastName)}\\s*$`, 'i'),
      tutorFirstName: new RegExp(`^\\s*${escapeRegex(firstName)}\\s*$`, 'i'),
    });

    if (!tutor) {
      notFound.push(`${lastName}, ${firstName}`);
      continue;
    }

    const current = tutor.sessionHistory ? tutor.sessionHistory.length : 0;

    if (current === desiredTotal) {
      console.log(`  ✓ ${lastName}, ${firstName} — already at ${desiredTotal}`);
      skipped++;
      continue;
    }

    if (current < desiredTotal) {
      // Pad with generated ObjectIds (not linked to real sessions, used only for count)
      const padding = desiredTotal - current;
      for (let i = 0; i < padding; i++) {
        tutor.sessionHistory.push(new mongoose.Types.ObjectId());
      }
    } else {
      // Trim excess entries from the end
      tutor.sessionHistory = tutor.sessionHistory.slice(0, desiredTotal);
    }

    await tutor.save();
    console.log(`  ✏ ${lastName}, ${firstName} — ${current} → ${desiredTotal}`);
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

/** Escape special regex characters in a string */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
