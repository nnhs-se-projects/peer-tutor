/**
 * schema for a Tutoring Session
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  // tutee of the session linked through object ID
  tutee: {
    type: Object,
    required: true,
  },
  // tutor of the session linked through object ID
  tutor: {
    type: Object,
    required: true,
  },
  // date of the session
  date: {
    type: Date,
    required: true,
  },
  // lunch period of the session
  period: {
    type: Number,
    required: true,
  },
  // location of the session
  location: {
    type: String,
    required: true,
  },
  // class subject of the session
  subject: {
    type: Object,
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
  // assignment worked on during the session
  assignment: {
    type: String,
    required: true,
  },
  // completion status of the session
  // true if completed, false if not
  completed: {
    type: String,
    required: true,
  },
});

const Session = mongoose.model("Session", schema);

module.exports = Session;
