# Copilot Instructions for Peer Tutoring App

## Project Overview

Peer Tutoring App is a role-based tutoring platform connecting tutors, students, tutor leaders, teachers, and admins. Users sign in with their District 203 Google account and see role-specific dashboards.

## Architecture

### Tech Stack

- **Backend**: Express 4 on Node.js 20+, EJS templating
- **Database**: MongoDB via Mongoose (see `server/database/connection.js`)
- **Frontend**: EJS views + Tailwind CSS (CDN) + custom CSS in `assets/css/styles.css` + client-side JS in `assets/js/`
- **Authentication**: Google Identity Services ID tokens verified in `server/routes/auth.js`; sessions in MongoDB via `connect-mongo` (`loginSessions` collection)

### Core Components

**Server** (`server.js`)

- Serves `/css`, `/img`, `/js` from `assets/`, then sessions, then a gate that sends signed-out users to `/auth` (or a 401 JSON error for API calls)
- Re-checks the signed-in user's role every minute (`resolveUser` in `server/utils/users.js`)
- Ends with an error handler: JSON for API calls and form posts, the error page otherwise

**Routes** (`server/routes/`)

- `auth.js`: sign-in (district accounts only), logout
- `attendance.js`: attendance page and API (mounted at `/attendance`)
- `router.js`: all other pages and JSON APIs

**Middleware** (`server/middleware/`)

- `roleAuth.js`: `requireRole(...roles)` with the role hierarchy, developer email lists
- `asyncRoute.js`: wraps async handlers so errors reach the error handler

**Utilities** (`server/utils/`)

- `users.js`: email → role lookup, case-insensitive tutor lookup by email
- `dates.js`: date-only parsing/formatting, attendance day ranges, Central time helpers
- `attendance.js`: attendance statuses and their days-missed weights
- `emailService.js`: nodemailer helpers and email templates
- `regex.js`: `escapeRegex`, `exactMatch`

**Data Models** (`server/model/`)

- `tutor.js`, `session.js`, `teacher.js`, `tutoringRequest.js`, `attendanceSchema.js`
- `courses.json` is the only list of subjects, classes, and teachers

**Views** (`views/`)

- Every page includes `include/_header`, `include/_navbar` (role-aware, pass `currentPage`), `include/_footer`, `include/_end`
- Page scripts live in `assets/js/<page>.js`; shared helpers in `common.js` (`escapeHtml`, `formatDateOnly`), `tableTools.js` (sort/search), and `tableExport.js` (text/xlsx export)

## Key Workflows

```bash
npm run dev          # nodemon server.js (port 8082 unless PORT is set)
npm start            # node server.js
npm run lint         # ESLint
npm run format       # Prettier (LF line endings)
npm run lint:ejs     # EJS syntax check
```

## Project-Specific Rules

**Security**

- Every route needs `requireRole(...)` for the lowest role allowed to use it; the global gate only checks that someone is signed in
- Take the user's identity from `req.session` (or `getTutorFromSession`), never from the request body
- Check ownership before changing a record (e.g. a tutor can only answer their own requests)
- Escape anything inserted with `innerHTML` using `escapeHtml`, or build elements with `textContent`
- Build regular expressions from user input only with `escapeRegex` / `exactMatch`

**Routes**

- Wrap async handlers in `asyncRoute(...)`
- API endpoints return `{ success, ... }` JSON; page routes render EJS with `currentPage`
- Validate request bodies (`cleanText`, catalog/option lists) before writing to MongoDB
- Use atomic updates (`findOneAndUpdate` with a status condition, `$inc`, `$push`) when two people could change the same record at once

**Dates**

- Calendar dates from forms are stored at noon UTC (`parseDateOnly`) and formatted in UTC (`formatDateOnly`) so they don't shift a day in Central time
- Attendance records are keyed by `getAttendanceDayRange` (midnight Central Standard Time)

**Data**

- Student data for the import scripts lives in `scripts/data/` and must never be committed
- Add classes and teachers to `server/model/courses.json` only

## Environment Variables

- `MONGO_URI`, `SESSION_SECRET` (required)
- `EMAIL_SENDER`, `EMAIL_PASSWORD` (optional, Gmail SMTP)
- `PORT` (optional, default 8082), `GOOGLE_CLIENT_ID` (optional)

Secrets are shared through Trello, never committed.
