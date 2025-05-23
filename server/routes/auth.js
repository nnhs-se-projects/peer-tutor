/**
 * Routes for authentication using the Google Sign-In API
 */

// cSpell:ignoreRegExp /[^\s]{40,}/

const express = require('express');
const route = express.Router();

const CLIENT_ID = '363824065747-7in8uucatifole229v7oaa6ndjldlfq3.apps.googleusercontent.com';

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
    req.session.email = await verify(req.body.credential);
    res.status(201).end();
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
