# Copilot Instructions for Peer Tutoring App

## Project Overview

Peer Tutoring App is a role-based tutoring platform connecting tutors, students, and teachers. Users authenticate via Google OAuth2 and access role-specific dashboards (tutor, student, teacher, admin).

## Architecture

### Tech Stack

- **Backend**: Express.js with Node.js, EJS templating
- **Database**: MongoDB via Mongoose (see `server/database/connection.js`)
- **Frontend**: EJS views + Tailwind CSS + client-side JS
- **Authentication**: Google OAuth2 with express-session (via `server/routes/auth.js`)
- **CSS**: Tailwind + custom Pico.min.css

### Core Components

**Authentication Flow** (`server/routes/auth.js`)

- Google OAuth2 verification stores email in `req.session.email`
- Session middleware in `server.js` redirects unauthenticated requests to `/auth/`
- Session secret stored in `.env` as `SESSION_SECRET`

**Data Models** (`server/model/`)

- `tutor.js`: Tutor schema with sessionHistory array, classes array, attendance tracking
- `session.js`: Session schema linking tutors, tutees, teachers, with subject/class/period
- `tutee.js`: Student schema with email and session history
- `teacher.js`: Teacher schema with admin boolean flag
- Schema comments document all fields; review each model before adding migrations

**Routes** (`server/routes/router.js`)

- Main router handles 400+ lines of route handlers
- Returns JSON from APIs, renders EJS for views
- Pattern: fetch from DB → format data → render view (e.g., line 22-45 homepage route)

**Views** (`views/`)

- EJS templates with role-based nav includes (`_tutNavBar.ejs`, `_teachNavBar.ejs`, etc.)
- Client-side JS in `assets/js/` (e.g., `tutorForm.js`, `sessionTable.js`)
- Namespace convention: view-specific JS matches view name

**Data Files** (`server/model/` and `assets/data/`)

- JSON files supply dropdown options: `grades.json`, `daysOfTheWeek.json`, `lunchPeriods.json`, subject/class files
- Used in forms and filters; ensure consistency when updating

## Key Workflows

### Starting Development

```bash
npm start  # Runs nodemon server.js on port 8080 (local) or 8082 (live)
```

### Code Quality

```bash
npm run lint           # Check JS and EJS
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format all files with Prettier
npm run lint:ejs      # EJS-specific linting
```

## Project-Specific Patterns

**Environment Variables**

- `.env` file required; see Trello for credentials
- Key vars: `SESSION_SECRET`, `MONGO_URI`, `GOOGLE_CLIENT_ID`

**Routing Pattern**

- API endpoints return JSON; page routes render EJS with data object
- Always check `req.session.email` exists before serving protected views

**Database Queries**

- Use `await Model.find()`, `.findById()`, `.findByIdAndUpdate()`
- Session storage: tutors/tutees have `sessionHistory` arrays; append new sessions to both tutor and tutee records

**Form Submissions**

- EJS forms POST to Express routes; routes update MongoDB and respond
- Subject/class selection cascades (e.g., `cteClasses.json` loaded by `courseList.json`)

**Frontend JS Conventions**

- Client scripts in `assets/js/` are loaded via `server.js` static routes
- Scripts access global data embedded in EJS templates (not via AJAX typically)

## Critical Files to Know

| File                      | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `server.js`               | App initialization, middleware, static routes |
| `server/routes/router.js` | All page & API routes (400+ lines)            |
| `server/routes/auth.js`   | Google OAuth2 verification                    |
| `server/model/*.js`       | Mongoose schemas (document all fields)        |
| `views/*.ejs`             | Templates; role-based navbars in `include/`   |
| `.env`                    | Database, OAuth, session credentials          |

## Common Tasks

**Adding a new form/page**

1. Create schema in `server/model/` if needed
2. Add route in `server/routes/router.js` (GET for form, POST for submission)
3. Create EJS view in `views/` with appropriate nav bar include
4. Add client-side validation in `assets/js/` if needed
5. Update JSON data files if new dropdowns required

**Querying/Updating MongoDB**

- Reference existing routes for patterns (e.g., tutor expertise or session creation)
- Always await async DB calls and wrap in try/catch
- Document schema changes in model comments

**Debugging**

- Check `req.session.email` to verify auth state
- Mongoose validation errors logged to console; check `.env` MongoDB connection string
- Browser console for frontend JS; use `nodemon` auto-restart for backend changes

## Notes

- Port switching: Search "8082" in `router.js` and `auth.js` for local (8080) vs. live (8082) deployment
- Admin pages partially implemented; require password middleware (see TODO in code)
- Tailwind CSS configured in `tailwind.config.js`; custom CSS in `assets/css/styles.css`
