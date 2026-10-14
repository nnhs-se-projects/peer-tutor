/**
 * Routes for authentication using the Google Sign-In API
 */

// cSpell:ignoreRegExp /[^\s]{40,}/

const express = require('express');
const route = express.Router();
const { OAuth2Client } = require('google-auth-library');
const { isAllowedEmail, resolveUser, applyUserToSession } = require('../utils/users');

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  '730546621620-dnost72pte48o0p59hbc7nj03ra94efl.apps.googleusercontent.com';

const DOMAIN_ERROR = 'Please sign in with your District 203 Google account.';

// from: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token#node.js
const client = new OAuth2Client();

/**
 * Verify the ID token from Google and return the signed-in email address.
 * Only verified accounts managed by the district are accepted.
 */
async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: GOOGLE_CLIENT_ID,
  });
  const { email, email_verified: emailVerified, hd } = ticket.getPayload();

  // `hd` is only present for accounts managed by a Google Workspace domain
  if (!email || !emailVerified || !hd || !isAllowedEmail(email)) {
    const error = new Error(DOMAIN_ERROR);
    error.status = 403;
    throw error;
  }

  return email.toLowerCase();
}

route.get('/', (req, res) => {
  res.render('auth', { googleClientId: GOOGLE_CLIENT_ID });
});

route.post('/', async (req, res) => {
  try {
    const email = await verify(req.body.credential);
    const user = await resolveUser(email);

    // Start a fresh session on login so an old session ID can't be reused
    req.session.regenerate(err => {
      if (err) {
        console.error('Error creating session:', err);
        return res.status(500).send('Authentication error');
      }

      req.session.email = email;
      applyUserToSession(req.session, user);
      res.status(201).json({ role: user.role });
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).send(DOMAIN_ERROR);
    }
    console.error('Error during authentication:', error.message);
    res.status(401).send('Authentication failed. Please try again.');
  }
});

// Logout route
route.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/auth');
  });
});

module.exports = route;
