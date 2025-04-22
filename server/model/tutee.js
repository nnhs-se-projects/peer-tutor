/**
 * schema for a Tutoring Session
 */

const mongoose = require('mongoose');
const sesh = require('./session');

const schema = new mongoose.Schema({
  // ID number of  tutee
  tuteeID: {
    type: Number,
    required: true,
  },
  // tutee email
  email: {
    type: String,
    required: true,
  },
  // tutee last name
  tuteeLastName: {
    type: String,
    required: true,
  },
  // tutee first name
  tuteeFirstName: {
    type: String,
    required: true,
  },
  // grade of tutee
  grade: {
    type: Number,
    required: true,
  },
  // session history of tutee
  sessionHistory: {
    type: [sesh],
    required: true,
  },
});

const Tutee = mongoose.model('Tutee', schema);

module.exports = Tutee;
