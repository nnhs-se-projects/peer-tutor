/**
 * main Javascript file for the application
 *  this file is executed by the Node server
 */

// load environment variables from the .env file into process.env
require('dotenv').config();

const http = require('http');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const connectDB = require('./server/database/connection');
const { wantsJson } = require('./server/middleware/roleAuth');
const { resolveUser, applyUserToSession } = require('./server/utils/users');

// How often the signed-in user's role is re-checked, so role changes apply without logging out
const ROLE_REFRESH_MS = 60 * 1000;

// invoke the express function to create an Express application
const app = express();

// add middleware to handle JSON in HTTP request bodies (used with
//  POST commands)
app.use(express.json());

// load assets (served before the session middleware so they don't need a session lookup)
app.use('/css', express.static('assets/css'));
app.use('/img', express.static('assets/img'));
app.use('/js', express.static('assets/js'));

// connect to the database
const database = connectDB();

// sessions are stored in MongoDB so they survive server restarts
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      clientPromise: database.then(mongoose => mongoose.connection.getClient()),
    }),
    cookie: { httpOnly: true, sameSite: 'lax' },
  })
);

// set the template engine to EJS, which generates HTML with embedded
//  JavaScript
app.set('view engine', 'ejs');

// keep the role in the session up to date with the database
app.use(async (req, res, next) => {
  if (!req.session.email || Date.now() - (req.session.roleCheckedAt || 0) < ROLE_REFRESH_MS) {
    return next();
  }

  try {
    applyUserToSession(req.session, await resolveUser(req.session.email));
    next();
  } catch (err) {
    next(err);
  }
});

// app.use takes a function that is added to the chain of a request.
//  When we call next(), it goes to the next function in the chain.
app.use((req, res, next) => {
  // Make session data available to all views via res.locals
  res.locals.user = {
    email: req.session.email,
    role: req.session.role,
    userName: req.session.userName,
    userId: req.session.userId,
    tutorID: req.session.tutorID,
  };

  const isAuthPage = req.path === '/auth' || req.path.startsWith('/auth/');

  // if the user is not logged in, send them to the authentication page
  if (req.session.email === undefined && !isAuthPage) {
    if (wantsJson(req)) {
      return res.status(401).json({ success: false, error: 'Please sign in again.' });
    }
    return res.redirect('/auth');
  }

  next();
});

// routes
app.use('/auth', require('./server/routes/auth'));
app.use('/attendance', require('./server/routes/attendance'));
app.use('/', require('./server/routes/router'));

// errors from any route end up here
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error(`Error handling ${req.method} ${req.originalUrl}:`, err);
  }
  if (res.headersSent) {
    return next(err);
  }

  // Client errors such as malformed JSON can be shown to the user
  const message =
    status < 500 && err.expose ? err.message : 'Something went wrong. Please try again later.';

  if (wantsJson(req)) {
    return res.status(status).json({ success: false, error: message });
  }
  res.status(status).render('error', { title: 'Something Went Wrong', message });
});

// create the HTTP server
const server = http.createServer(app);

const PORT = process.env.PORT || 8082;
server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
