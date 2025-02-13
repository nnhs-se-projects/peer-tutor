/**
 * schema for a Tutoring Session
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  // tutor first name
  tutorFirstName: {
    type: String,
    required: true,
  },
  // tutor last name
  tutorLastName: {
    type: String,
    required: true,
  },
  // date of the session
  sessionDate: {
    type: Date,
    required: true,
  },
  // session period
  sessionPeriod: {
    type: String,
    required: true,
  },
  // location of the session
  sessionPlace: {
    type: String,
    required: true,
  },
  // class subject of the session
  subject: {
    type: String,
    required: true,
  },
  // class of the session
  class: {
    type: String,
    required: true,
  },
  // teacher class for the session
  teacher: {
    type: String,
    required: true,
  },
  // focus of the session
  FocusOfSession: {
    type: String,
    required: true,
  },
  // assignment worked on during the session
  workaccomplished: {
    type: String,
    required: true,
  },
  // tutee first name
  tuteeFirstName: {
    type: String,
    required: true,
  },
  // tutee last name
  tuteeLastName: {
    type: String,
    required: true,
  },
  // tutee ID
  tuteeID: {
    type: String,
    required: true,
  },
  // tutee grade
  grade: {
    type: String,
    required: true,
  },
});

const Session = mongoose.model("Session", schema);

module.exports = Session;
