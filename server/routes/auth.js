/**
 * Routes for authentication using the Google Sign-In API
 */

// cSpell:ignoreRegExp /[^\s]{40,}/

const express = require("express");
const route = express.Router();

const CLIENT_ID =
  "1022838194773-p8g5ac0qr11mfko61qurgnqdb9jitpjf.apps.googleusercontent.com";

// from: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token#node.js
const { OAuth2Client } = require("google-auth-library");
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

route.get("/", (req, res) => {
  res.render("auth");
});

route.post("/", async (req, res) => {
  req.session.email = await verify(req.body.credential);
  res.status(201).end();
});

module.exports = route;
