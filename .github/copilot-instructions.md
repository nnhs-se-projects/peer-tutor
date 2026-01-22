# Peer Tutoring App - AI Agent Instructions

## Project Overview
A Node.js/Express web app for managing high school peer tutoring. Users include tutors (log sessions/expertise), students (find/request tutors), teachers (view databases), and tutor leaders (take attendance). Uses MongoDB with Mongoose ODM, EJS templates, Google OAuth, and Tailwind CSS.

## Architecture & Data Flow

### Entry Point & Routing
- **[server.js](../server.js)**: Main entry point. Port **8082** for production, 8080 for local dev
- Global auth middleware redirects unauthenticated users to `/auth` (Google OAuth)
- Two route modules: `server/routes/router.js` (main routes) and `routes/attendance.js` (attendance-specific)
- Session management via `express-session` with `SESSION_SECRET` from `.env`

### Database Structure (MongoDB/Mongoose)
- **Tutor** ([server/model/tutor.js](../server/model/tutor.js)): Core model with `sessionHistory` array referencing Session `_id`s
- **Session** ([server/model/session.js](../server/model/session.js)): Tutor session records linked back to Tutor
- **Tutee** ([server/model/tutee.js](../server/model/tutee.js)): Student records (minimal usage currently)
- **Teacher** ([server/model/teacher.js](../server/model/teacher.js)): Teacher accounts with admin flag
- Connection: [server/database/connection.js](../server/database/connection.js) using `MONGO_URI` from `.env`

### Frontend Structure
- **Views**: EJS templates in `views/` with partials in `views/include/` (`_header.ejs`, `_footer.ejs`, nav bars)
- **Static Assets**: Served from both `assets/` and `public/` directories
  - `assets/js/`: Client-side JS (form handling, API calls)
  - `assets/css/`: Stylesheets + Tailwind CSS (CDN in header)
  - JSON data files duplicated in `assets/js/data/` and `public/js/data/` (course lists)
- **Pattern**: Client JS makes `fetch()` calls to API endpoints, server renders EJS templates

### JSON Data Files
Course/class data stored in JSON files in two locations:
- **Server**: `server/model/` (grades, lunch periods, days of week, etc.)
- **Client**: `assets/js/data/` and `public/js/data/` (department course lists: math, english, science, etc.)
- Loaded server-side via `require()`, client-side via `fetch('/js/data/${dept}.json')`

## Key Conventions

### Port Configuration
- **Production/Live**: Port 8082 (current [server.js](../server.js) default)
- **Local Dev**: Change to 8080 in server.js AND update OAuth callback URLs in auth.js
- **Critical**: OAuth redirect URIs must match Google Cloud Console config (see [OAUTH_SETUP.md](../OAUTH_SETUP.md))

### Authentication Flow
- [server/routes/auth.js](../server/routes/auth.js): Google Sign-In using `google-auth-library`
- Client sends JWT credential from Google to `/auth` POST endpoint
- Server verifies token, extracts email, stores in `req.session.email`
- **Known Issue**: No district-203 email domain validation (anyone can log in)

### Form Submission Pattern
1. Client JS (e.g., [assets/js/tutorForm.js](../assets/js/tutorForm.js)) captures form data
2. `fetch()` POST to server endpoint (e.g., `/submitTutorForm`)
3. Server validates, creates Mongoose model instance, saves to DB
4. For sessions: Also updates related Tutor's `sessionHistory` array
5. **Known Issue**: Session form shows error despite successful save

### Data Type Mismatches
- **Schema vs JSON**: Some fields defined as `Number` in schemas but stored as `String` in JSON files
- Example: `lunchPeriod` is `Number` in Tutor schema but strings in JSON data
- **Workaround**: `.toString()` conversions in route handlers (see [routes/attendance.js](../routes/attendance.js#L26))

### Static File Serving
```javascript
app.use('/css', express.static('assets/css'));
app.use('/css', express.static('public/css'));
app.use('/js', express.static('assets/js'));
app.use('/js', express.static('public/js'));
```
Files served from both `assets/` and `public/` with `/css` and `/js` prefixes.

## Development Workflow

### Running Locally
```bash
npm install
npm start  # Uses nodemon for auto-restart
```
- Server starts on port 8082 (change to 8080 for local + update auth.js)
- Requires `.env` file with `MONGO_URI` and `SESSION_SECRET`
- MongoDB Compass recommended for database inspection

### Linting & Formatting
```bash
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix issues
npm run format        # Prettier format
npm run lint:ejs      # EJS template linting
```
ESLint configured with Prettier integration. EJS files linted separately.

### Database Setup
- Get `.env` contents from Trello (per README)
- MongoDB connection string in `MONGO_URI`
- Google OAuth credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`

## Known Issues & Technical Debt

1. **Attendance System**: Non-functional - buttons don't update correctly, schema incomplete
2. **Request Tutor**: Form submits but doesn't send requests anywhere
3. **Auth Domain**: No district email validation
4. **Session Form Error**: Displays error on success
5. **File Duplication**: JSON files duplicated across `assets/`, `public/`, `server/model/`
6. **Unused Models**: `habitsOfMind.json` and `entry.js` should be removed
7. **Port Switching**: Manual changes needed for local vs production (auth.js + server.js)

## 🆕 Implementing Missing Features

### Fixing Request Tutor Feature
**Current State**: Form at `/stuHome` submits to `/api/tutoringRequest` but endpoint returns 501 "Not implemented"
**To Implement**:
1. Create `TutoringRequest` schema in `server/model/` with fields:
   - `studentEmail`, `tutorID`, `subject`, `class`, `preferredTime`, `requestDate`, `status` (pending/approved/declined)
2. Add POST handler in `server/routes/router.js`:
   ```javascript
   route.post('/api/tutoringRequest', async (req, res) => {
     const request = new TutoringRequest({
       studentEmail: req.session.email,
       tutorID: req.body.tutorID,
       // ... other fields from req.body
     });
     await request.save();
     // TODO: Send email notification to tutor
     res.json({ success: true });
   });
   ```
3. Add notification system (email or in-app) to alert tutors of new requests
4. Create admin/tutor view to approve/decline requests

### Fixing Attendance System
**Current State**: Buttons in `views/attendance.ejs` don't persist updates correctly
**Issues**:
- Frontend: `assets/js/attendance.js` sends wrong endpoint (`/updateAttendance/:tutorId` vs `/attendance/updateAttendance`)
- Backend: Route exists at `/attendance/updateAttendance` but frontend doesn't use correct path
**To Fix**:
1. Update `assets/js/attendance.js` fetch URL from `/updateAttendance/${tutorId}` to `/attendance/updateAttendance`
2. Verify response handling updates DOM correctly after successful POST
3. Add real-time validation: check if attendance count makes sense (can't be negative)
4. Consider adding attendance history tracking (date/time stamps for each absence)

### Adding District Email Validation
**Current State**: [server/routes/auth.js](../server/routes/auth.js) accepts any Google email
**To Implement**:
```javascript
route.post('/', async (req, res) => {
  try {
    const email = await verify(req.body.credential);
    
    // Add domain validation
    if (!email.endsWith('@dist203.net') && !email.endsWith('@nnhs.org')) {
      return res.status(403).json({ 
        error: 'Access denied. Please use your District 203 email.' 
      });
    }
    
    req.session.email = email;
    res.status(201).end();
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).send('Authentication error');
  }
});
```
Update `assets/js/auth.js` to display domain error to users.

### Fixing Session Form Error Message
**Current State**: `assets/js/tutorForm.js` shows error despite successful submission
**Root Cause**: Two fetch calls - second one to `/sessionTable` likely failing
**To Fix**:
1. Check `server/routes/router.js` - `/sessionTable` is GET route, not POST (line 312)
2. Remove duplicate POST to `/sessionTable` in `assets/js/tutorForm.js` (lines 271-285)
3. Session already saved in first fetch to `/submitTutorForm` - second call is redundant

## API Endpoints

### Public Routes (require auth)
- `GET /`: Homepage with top tutors leaderboard
- `GET /tutHome`, `/stuHome`, `/teachHome`, `/leadHome`, `/adminHome`: Role-specific dashboards
- `GET /expertiseForm`, `/tutorForm`, `/tutorAttendance`: Forms
- `POST /submitTutorForm`, `/submitExpertiseForm`: Form submissions

### API Routes (JSON responses)
- `GET /api/tutors?subject=X&class=Y`: Find tutors by class
- `GET /api/student/sessions`: Student's session history
- `POST /api/tutoringRequest`: Submit tutoring request (unimplemented)
- `GET /api/tutor-attendance/:tutorID`: Tutor attendance lookup
- `POST /updateAttendance`: Update tutor attendance count

### Database Views
- `GET /tutorTable`: All tutors (formatted for teachers)
- `GET /sessionTable`: All sessions (formatted for teachers)

## File Structure Patterns

- **Models**: `server/model/*.js` (Mongoose schemas)
- **Routes**: `server/routes/*.js` + `routes/*.js` (Express routers)
- **Views**: `views/*.ejs` with `views/include/_*.ejs` partials
- **Client JS**: `assets/js/*.js` (page-specific client logic)
- **Data**: `server/model/*.json` (server), `assets/js/data/*.json` (client)

## When Making Changes

- **Adding Forms**: Create client JS in `assets/js/`, route handler in `server/routes/router.js`, EJS view in `views/`
- **New Model Fields**: Update Mongoose schema, consider JSON data files, check for type mismatches
- **Auth Changes**: Update both [server/routes/auth.js](../server/routes/auth.js) and Google Cloud Console
- **Port Changes**: Update [server.js](../server.js) + OAuth callback URLs in auth.js + Google Console
- **Static Assets**: Place in `assets/` OR `public/` (both served), prefer `assets/` for new files
- **EJS Partials**: Reusable components in `views/include/`, different nav bars per role
