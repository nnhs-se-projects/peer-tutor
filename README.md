# Peer Tutoring App

## Overview

Peer Tutoring App is a role-based tutoring platform for students, tutors, tutor leaders, teachers, and admins. Users sign in with their District 203 Google account and are routed to role-specific dashboards. Tutors submit expertise and session forms, view session history and attendance profiles, and tutor leaders can take attendance for each lunch period. Teachers can browse tutor and session tables. Students can browse tutors by subject/class and submit tutoring requests.

Live server: https://peertutordev.nnhsse.org/

The UI is built with EJS templates, Tailwind CSS utility classes, and a small set of custom styles.

## Platform Requirements

External services and tools needed to run the full platform:

- **Node.js 20+ and npm** (see Toolchain Setup doc below)
- **MongoDB** (local or hosted Atlas instance)
- **Google Sign-In** client configured in Google Cloud (see [OAUTH_SETUP.md](OAUTH_SETUP.md))
- **Gmail SMTP** (optional, for automated tutoring-request emails)

Toolchain Setup: https://docs.google.com/document/d/1wvdn-MVotuBM6wehNdPpbbOFMzmKLPxFzErH8-mkP1s/preview?tab=t.0

MongoDB Compass (optional): https://www.mongodb.com/try/download/compass

## Local Development Setup

1. Install dependencies:
   - `npm install`
2. Create a `.env` file in the project root (do **not** commit secrets to GitHub):
   - `MONGO_URI=` (MongoDB connection string)
   - `SESSION_SECRET=` (session signing secret)
   - `EMAIL_SENDER=` (optional, Gmail address for SMTP notifications)
   - `EMAIL_PASSWORD=` (optional, Gmail app password)
   - `PORT=` (optional, defaults to 8082)
   - `GOOGLE_CLIENT_ID=` (optional, defaults to the team's Google Sign-In client)

> Store secrets in Trello (per team process). Do not add secrets to README or GitHub.

3. Start the server:

   - `npm run dev` (restarts when files change) or `npm start`

4. Open the site at `http://localhost:8082` (or the `PORT` you set). The address must be listed as an authorized JavaScript origin for the Google client, see [OAUTH_SETUP.md](OAUTH_SETUP.md).

Expected result: Google Sign-In appears, then the user lands on the role-specific homepage. Only `@naperville203.org` and `@stu.naperville203.org` accounts can sign in.

### Code quality

- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run format` / `npm run format:check` — Prettier (files use LF line endings)
- `npm run lint:ejs` — checks EJS templates for syntax errors

## Development vs. Production

- **Local dev**

  - Runs on localhost (port 8082 unless `PORT` is set).
  - Uses a local `.env` file for secrets.
  - May use a local MongoDB instance.

- **Development server (peertutordev)**

  - Deployed instance for demos and QA.
  - Uses a hosted MongoDB database and server-side environment variables.

- **Production**
  - Same runtime stack (Node.js + Express + MongoDB).
  - Separate MongoDB database and OAuth credentials.
  - Same codebase with environment-specific secrets.

After pulling new code on a server, run `npm install` before restarting.

## Architecture (High Level)

- **Backend:** Express.js server (`server.js`) with EJS templating. Login sessions are stored in MongoDB (`loginSessions` collection), so they survive restarts.
- **Auth:** Google Sign-In verification (`server/routes/auth.js`). The role for an account is worked out in `server/utils/users.js` and re-checked every minute, so role changes apply without logging out.
- **Permissions:** every route declares who can use it with `requireRole(...)` (`server/middleware/roleAuth.js`).
- **Database:** MongoDB via Mongoose models in `server/model/`.
- **Frontend:** EJS views in `views/` with one shared role-aware navbar (`views/include/_navbar.ejs`), Tailwind CSS + custom CSS, and page-specific client scripts in `assets/js/`. `assets/js/common.js` (loaded on every page) provides `escapeHtml` for anything built with `innerHTML`.
- **Routing:** page and API routes in `server/routes/router.js`, attendance in `server/routes/attendance.js`, sign-in in `server/routes/auth.js`.

Request flow (typical): Browser → Express route → Mongoose queries → render EJS view or return JSON → client JS enhances tables/forms.

### Who can do what

Roles inherit everything below them: developer ⊃ admin ⊃ lead ⊃ tutor ⊃ student, and admin ⊃ teacher ⊃ student.

| Role    | Can                                                                                   |
| ------- | ------------------------------------------------------------------------------------- |
| Student | Search tutors, submit tutoring requests                                               |
| Tutor   | Log sessions, edit their own expertise form, claim requests, see their own attendance |
| Lead    | Take attendance, look up any tutor's attendance, send notifications to tutors         |
| Teacher | View the tutor and session tables                                                     |
| Admin   | Edit past attendance, add/delete tutors, change roles, see all requests               |

Accounts get their role from their tutor record (`role`), from a teacher record (`admin` → admin), or default to teacher for district staff emails and student for everyone else.

## Data Schema (MongoDB)

The following schemas are defined in `server/model/`:

### Tutor

- `role` (string, enum: student/tutor/lead/teacher/admin/developer)
- `isActive` (boolean; inactive tutors sign in as students and are left off attendance)
- `tutorFirstName` (string)
- `tutorLastName` (string)
- `tutorID` (number, the tutor's student ID)
- `email` (string, the Google account they sign in with)
- `grade` (number)
- `returning` (boolean)
- `lunchPeriod` (number)
- `daysAvailable` (string[])
- `classes` (string[])
- `tutorLeader` (boolean)
- `attendance` (number, days missed: absent +1, tardy +0.5, makeup −1)
- `sessionHistory` (ObjectId[] referencing Session)
- `pastSessionCount` (number, sessions completed before they were logged on the site)

### Session

- `sessionDate` (date, stored at noon UTC)
- `tuteeName` (string)
- `tutorName` (string)
- `tutorId` (ObjectId referencing Tutor)
- `sessionPeriod` (string, e.g., 4th/5th/6th/WIN)
- `teacher` (string)
- `department` (string)
- `class` (string)
- `focusOfSession` (string)
- `workAccomplished` (string)
- `isMakeup` (boolean)
- Legacy fields retained for old records: `tutorFirstName`, `tutorLastName`, `tuteeFirstName`, `tuteeLastName`, `subject`, `tutorID`, `sessionPlace`, `tuteeID`, `tuteeGrade`

### Teacher

- `email` (string)
- `teacherFirstName` (string)
- `teacherLastName` (string)
- `admin` (boolean)

### TutoringRequest

- Student: `studentEmail`, `studentFirstName`, `studentLastName`, `studentID`, `studentGrade`
- Tutor (set when claimed): `tutorId` (ref Tutor), `tutorName`, `tutorEmail`
- Request details: `requestType`, `subject`, `class`, `topic`, `preferredDate` (noon UTC), `preferredPeriod`, `additionalNotes`
- Status flow: `status` (pending/accepted/declined/completed), `responseMessage`, `respondedAt`
- Timestamps: `createdAt`, `updatedAt`

### Attendance

- `date` (date, midnight Central Standard Time)
- `lunchPeriod` (number)
- `tutors` (array of per-tutor records)
  - `tutorId` (the tutor's student ID), `tutorFirstName`, `tutorLastName`, `email`, `status` (present/tardy/absent/makeup), `futureMakeup`, `futureAbsenceDate`
- Timestamps: `createdAt`, `updatedAt`

## JSON Data Files

These files in `server/model/` supply dropdowns and course lists used in forms and filters.

- `courses.json` — every subject with its classes and teachers. It is the only class list: student requests, the expertise form, and the session form all use it, so class names always match. Served to the browser at `/api/courses`.
- `grades.json`, `daysOfTheWeek.json`, `lunchPeriods.json`, `newReturningOptions.json` — option lists for the forms.

## Maintenance Scripts

Run these from the project root with `node scripts/<name>.js`. They use `MONGO_URI` from `.env`. Student data they read lives in `scripts/data/`, which is not committed; see [scripts/data/README.md](scripts/data/README.md).

- `import-tutors.js` — import tutors and attendance from the period CSVs. Never changes existing roles.
- `import-from-csv.js` — import tutor expertise (classes and days) and attendance from exported sheets.
- `update-session-counts.js` — set each tutor's sessions from before the site (`pastSessionCount`).
- `migrate-session-padding.js` — one-time: moves placeholder ids that the old version of `update-session-counts.js` put in `sessionHistory` into `pastSessionCount`. Totals don't change. Safe to run more than once.
- `backfill-attendance.js [--since YYYY-MM-DD]` — recalculate days missed from attendance records.
- `purge-attendance.js --yes` — reset everyone's days missed to 0 (e.g. at the start of a semester).

## Features (Expected Behavior)

- **Role-based dashboards**: Users see tutor, student, teacher, lead, or admin pages based on their role.
- **Tutor expertise form**: Tutors submit classes and availability for their own record. Admins can add other tutors from the tutor table.
- **Session logging**: Tutors record tutoring sessions, which appear on the session table for teachers.
- **Attendance tracking**: Tutor leaders record attendance per day/period; attendance records are stored and summarized.
- **Tutor directory**: Teachers view a searchable tutor table with contact and subject info.
- **Tutoring requests**: Students submit tutoring requests, which appear on the general request board for tutors who listed that class. Requests drop off the board after their date passes.
- **Email notifications (optional)**: Accept/decline notifications sent to students if `EMAIL_SENDER`/`EMAIL_PASSWORD` are configured.

## Sprint #1 Questions (Answered)

**Should we have a session-form field for a tutor leader code to confirm the session occurred?**

- Current approach: authentication and role-based access are used to validate who submits sessions. No tutor-leader code is required at this time.

**What is the desired format for viewing session data (Google Sheet vs. in-app table)?**

- The in-app session table is the primary format. It supports sorting/filtering and can be exported if needed.

**Is logout necessary? Why would someone want to log out?**

- Yes. Logout clears the session on shared devices, switches roles/accounts, and protects access to student data.
