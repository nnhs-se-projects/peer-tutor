/**
 * Loads the private data files the scripts need from scripts/data/ (see the README there).
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readDataFile(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing scripts/data/${fileName}. See scripts/data/README.md.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Tutor emails keyed by "lastname|firstname" (lowercased). A null email means skip that tutor.
const loadTutorEmails = () => new Map(Object.entries(readDataFile('tutor-emails.json')));

module.exports = { DATA_DIR, readDataFile, loadTutorEmails };
