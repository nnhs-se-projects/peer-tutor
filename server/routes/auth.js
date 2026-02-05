/**
 * Routes for authentication using the Google Sign-In API
 */

// cSpell:ignoreRegExp /[^\s]{40,}/

const express = require('express');
const route = express.Router();
const Tutor = require('../model/tutor');
const Teacher = require('../model/teacher');

const CLIENT_ID = '730546621620-dnost72pte48o0p59hbc7nj03ra94efl.apps.googleusercontent.com';

// Developer emails - these users always have developer role with full access
const DEVELOPER_EMAILS = [
  'eqin@stu.naperville203.org',
  'mkfedorovskiy@stu.naperville203.org',
  'jxwu@stu.naperville203.org',
  'opbhide@stu.naperville203.org',
];

// from: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token#node.js
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client();
async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
  });
  const { sub, email } = ticket.getPayload();
  console.log(sub, email);
  return email;
}

route.get('/', (req, res) => {
  res.render('auth');
});

route.post('/', async (req, res) => {
  try {
    const email = await verify(req.body.credential);
    req.session.email = email;

    // Debug: Log email for troubleshooting
    console.log('Login email:', email);
    console.log('Email lowercase:', email.toLowerCase());
    console.log('Is developer?', DEVELOPER_EMAILS.includes(email.toLowerCase()));

    // Check if user is a developer (hardcoded list)
    if (DEVELOPER_EMAILS.includes(email.toLowerCase())) {
      req.session.role = 'developer';
      req.session.userName = email.split('@')[0];

      // Ensure developer tutor record exists with developer role
      const existingTutor = await Tutor.findOne({ email: email });
      if (existingTutor && existingTutor.role !== 'developer') {
        existingTutor.role = 'developer';
        await existingTutor.save();
      }

      console.log('Assigned developer role to:', email);
      return res.status(201).json({ role: req.session.role });
    }

    // Look up user role from database
    // First check if user is a tutor/lead
    const tutor = await Tutor.findOne({ email: email });
    if (tutor) {
      // Use role from database, default to 'tutor' if not set
      req.session.role = tutor.role || (tutor.tutorLeader ? 'lead' : 'tutor');
      req.session.userId = tutor._id;
      req.session.userName = `${tutor.tutorFirstName} ${tutor.tutorLastName}`;
      req.session.tutorID = tutor.tutorID;
      return res.status(201).json({ role: req.session.role });
    }

    // Check if user is a teacher/admin
    const teacher = await Teacher.findOne({ email: email });
    if (teacher) {
      req.session.role = teacher.admin ? 'admin' : 'teacher';
      req.session.userId = teacher._id;
      req.session.userName = `${teacher.teacherFirstName} ${teacher.teacherLastName}`;
      return res.status(201).json({ role: req.session.role });
    }

    // Default to student role for unregistered users
    req.session.role = 'student';
    req.session.userName = email.split('@')[0];

    res.status(201).json({ role: req.session.role });
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).send('Authentication error');
  }
});

// Logout route
route.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth');
});

module.exports = route;
