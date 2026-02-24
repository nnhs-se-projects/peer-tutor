/**
 * schema for a Tutoring Session
 */

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // date/time the session was recorded
  sessionDate: {
    type: Date,
    required: true,
  },
  // tutee name (Last Name, First Name)
  tuteeName: {
    type: String,
    required: true,
  },
  // tutor name (Last Name, First Name)
  tutorName: {
    type: String,
    required: true,
  },
  // session period (e.g. "4th", "5th", "6th", "WIN", "RAT")
  sessionPeriod: {
    type: String,
    required: true,
  },
  // specific teacher for the session
  teacher: {
    type: String,
    required: true,
  },
  // department / subject area of the session
  department: {
    type: String,
    required: true,
  },
  // specific class of the session
  class: {
    type: String,
    required: true,
  },
  // focus of the session
  focusOfSession: {
    type: String,
    required: true,
  },
  // assignment and work accomplished during the session
  workAccomplished: {
    type: String,
    required: true,
  },
  // whether this session is a makeup session
  isMakeup: {
    type: Boolean,
    default: false,
  },

  // ── Legacy fields (kept so old records still display) ──────────────
  // These are NOT required for new sessions. They allow Mongoose to read
  // existing documents that were saved with the old schema.
  tutorFirstName: { type: String },
  tutorLastName: { type: String },
  tuteeFirstName: { type: String },
  tuteeLastName: { type: String },
  subject: { type: String },
  tutorID: { type: String },
  sessionPlace: { type: String },
  tuteeID: { type: String },
  tuteeGrade: { type: String },
});

const Session = mongoose.model('Session', schema);

module.exports = Session;
