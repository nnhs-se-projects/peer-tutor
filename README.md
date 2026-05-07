# Peer Tutoring App

## Overview

Peer Tutoring App is a role-based tutoring platform for students, tutors, tutor leaders, teachers, and admins. Users authenticate with Google OAuth2 and are routed to role-specific dashboards. Tutors submit expertise and session forms, view session history and attendance profiles, and tutor leaders can take attendance for each lunch period. Teachers can browse tutor and session tables. Students can browse tutors by subject/class and submit tutoring requests.

Live server: https://peertutordev.nnhsse.org/

The UI is built with EJS templates, Tailwind CSS utility classes, and a small set of custom styles.

## Platform Requirements

External services and tools needed to run the full platform:

- **Node.js + npm** (see Toolchain Setup doc below)
- **MongoDB** (local or hosted Atlas instance)
- **Google OAuth2** credentials for Sign-In (client configured in Google Cloud)
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

> Store secrets in Trello (per team process). Do not add secrets to README or GitHub.

3. Start the server:

   - `npm start`

4. Open the site:
   - Default server port is **8082** (see `server.js`).
   - For local development, the team often uses **8080**. If you need 8080, update any hardcoded references to 8082 (notably in routing/auth logic that builds URLs) and restart.

Expected result: Google Sign-In appears, then the user lands on the role-specific homepage. Tutor and session tables should populate once the MongoDB connection is valid.

## Development vs. Production

- **Local dev**

  - Runs on localhost (typically 8080 or 8082).
  - Uses a local `.env` file for secrets.
  - May use a local MongoDB instance.

- **Development server (peertutordev)**

  - Deployed instance for demos and QA.
  - Uses a hosted MongoDB database and server-side environment variables.
  - Port remains 8082 by default.

- **Production**
  - Same runtime stack (Node.js + Express + MongoDB).
  - Separate MongoDB database and OAuth credentials.
  - Same codebase with environment-specific secrets.

## Architecture (High Level)

- **Backend:** Express.js server (`server.js`) with EJS templating.
- **Auth:** Google Sign-In verification (`server/routes/auth.js`) with session management via `express-session`.
- **Database:** MongoDB via Mongoose models in `server/model/`.
- **Frontend:** EJS views in `views/`, Tailwind CSS + custom CSS, and page-specific client scripts in `assets/js/`.
- **Routing:** Main page/API routes in `server/routes/router.js` plus feature routes (e.g., attendance).

Request flow (typical): Browser → Express route → Mongoose queries → render EJS view or return JSON → client JS enhances tables/forms.

## Data Schema (MongoDB)

The following schemas are defined in `server/model/`:

### Tutor

- `role` (string, enum: student/tutor/lead/teacher/admin/developer)
- `googleId` (string, optional)
- `isActive` (boolean)
- `tutorFirstName` (string)
- `tutorLastName` (string)
- `tutorID` (number)
- `email` (string)
- `grade` (number)
- `returning` (boolean)
- `lunchPeriod` (number)
- `daysAvailable` (string[])
- `classes` (string[])
- `tutorLeader` (boolean)
- `attendance` (number)
- `sessionHistory` (ObjectId[] referencing Session)

### Session

- `sessionDate` (date)
- `tuteeName` (string)
- `tutorName` (string)
- `sessionPeriod` (string, e.g., 4th/5th/6th/WIN)
- `teacher` (string)
- `department` (string)
- `class` (string)
- `focusOfSession` (string)
- `workAccomplished` (string)
- `isMakeup` (boolean)
- Legacy fields retained for old records: `tutorFirstName`, `tutorLastName`, `tuteeFirstName`, `tuteeLastName`, `subject`, `tutorID`, `sessionPlace`, `tuteeID`, `tuteeGrade`

### Tutee

- `tuteeID` (number)
- `email` (string)
- `tuteeLastName` (string)
- `tuteeFirstName` (string)
- `grade` (number)
- `sessionHistory` (Session[] embedded objects)

### Teacher

- `email` (string)
- `teacherFirstName` (string)
- `teacherLastName` (string)
- `admin` (boolean)

### TutoringRequest

- Student: `studentEmail`, `studentFirstName`, `studentLastName`, `studentID`, `studentGrade`
- Tutor (optional): `tutorId` (ref Tutor), `tutorName`, `tutorEmail`
- Request details: `requestType`, `subject`, `class`, `topic`, `preferredDate`, `preferredPeriod`, `additionalNotes`
- Status flow: `status` (pending/accepted/declined/completed), `responseMessage`, `respondedAt`
- Timestamps: `createdAt`, `updatedAt`

### Attendance

- `date` (date)
- `lunchPeriod` (number)
- `tutors` (array of per-tutor records)
  - `tutorId`, `tutorFirstName`, `tutorLastName`, `email`, `status` (present/tardy/absent/makeup)
- Timestamps: `createdAt`, `updatedAt`

## JSON Data Files

These files supply dropdowns and course lists used in forms and filters.

**Server-side model data** (`server/model/`)

- `courseList.json` maps departments to class lists.
- `*_Classes.json`, `grades.json`, `daysOfTheWeek.json`, `lunchPeriods.json`, `newReturningOptions.json` define option arrays.

**Client-side data** (`assets/data/` and `public/js/data/`)

- Subject-specific lists like `math.json`, `science.json`, `world-classical-language.json`.

## Features (Expected Behavior)

- **Role-based dashboards**: Users see tutor, student, teacher, or lead pages based on their session role.
- **Tutor expertise form**: Tutors submit classes and availability; stored in MongoDB.
- **Session logging**: Tutors record tutoring sessions, which appear on the session table for teachers.
- **Attendance tracking**: Tutor leaders record attendance per day/period; attendance records are stored and summarized.
- **Tutor directory**: Teachers view a searchable tutor table with contact and subject info.
- **Tutoring requests**: Students can submit tutoring requests; requests are stored and can notify tutors via email when SMTP is configured.
- **Email notifications (optional)**: Accept/decline notifications sent to students if `EMAIL_SENDER`/`EMAIL_PASSWORD` are configured.

## Known Limitations

- Some tutoring request flows are still being finalized.
- Attendance UI logic is in progress and may not fully update counts.
- A few legacy schema and data-type mismatches exist between JSON option files and Mongo types.

## User Stories

- As an admin, I want to see the schedule formed by the student expertise form so that I can view the schedule.
- As an admin, I want to be able to have the information from the tutor session form organized for me in the desired format.
- As an admin, I want to see the tutors ranked by tutor session so I can see who is nearing 100 sessions and compare tutors and their sessions.
- As an admin, I want an automated notification/email/message sent to tutors who have missed 1–2 sessions (have outstanding absences) so that I don't have to send them manually.
- As an admin, I want to remove tutors so that after a semester has concluded, I can remove tutors who are no longer continuing.
- As an admin, I want to add certain tutors at the beginning of the semester.
- As a tutor leader, I want to be able to take attendance for the tutors that come in each period/day and have it keep track of their attendance, letting me know how many days they've been absent.
- As a student/tutee, I want to be able to see which subjects are being tutored on a given day and lunch period (updated daily).

## Sprint #1 Questions (Answered)

**Should we have a session-form field for a tutor leader code to confirm the session occurred?**

- Current approach: authentication and role-based access are used to validate who submits sessions. No tutor-leader code is required at this time.

**What is the desired format for viewing session data (Google Sheet vs. in-app table)?**

- The in-app session table is the primary format. It supports sorting/filtering and can be exported if needed.

**Is logout necessary? Why would someone want to log out?**

- Yes. Logout clears the session on shared devices, switches roles/accounts, and protects access to student data.

