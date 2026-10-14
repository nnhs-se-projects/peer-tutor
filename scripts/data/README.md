# Import data (not committed)

Everything in this folder except this README is ignored by git, because it holds student
names, ID numbers, emails, and attendance. Get the files from the team's private storage
(Trello) and put them here before running the scripts in `scripts/`.

| File                                             | Used by                                  |
| ------------------------------------------------ | ---------------------------------------- |
| `2026 Peer Tutors - S2 Period 4.csv` (5, 6)      | `import-tutors.js`, `import-from-csv.js` |
| `2026 Peer Tutors - Tutor Expertise.csv`         | `import-from-csv.js`                     |
| `tutor-emails.json` — `{ "last\|first": email }` | `import-tutors.js`, `import-from-csv.js` |
| `session-counts.json` — sessions before the site | `update-session-counts.js`               |
