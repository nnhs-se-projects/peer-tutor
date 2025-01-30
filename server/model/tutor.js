/**
 * schema for a Tutoring Session
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  // tutee last name
  last: {
    type: String,
    required: true,
  },
  // tutee first name
  first: {
    type: String,
    required: true,
  }, // tutee email
  email: {
    type: String,
    required: true,
  },
  // ID number of  tutee
  IDnumber: {
    type: Number,
    required: true,
  },
  // grade of tutee
  grade: {
    type: Number,
    required: true,
  },

  returning: {
    type: Boolean,
    required: true,
  },

  period: {
    type: Number,
    required: true,
  },
  daysAvailable: {
    type: [String],
    required: true,
  },

  classes: {
    type: [String],
    required: true,
  },

  tutorLeader: {
    type: Boolean,
    required: true,
  },
  attendance: {
    type: Number,
    required: true,
  },
  // session history of tutee
  sessionHistory: {
    type: [session],
    required: true,
  },
});

const Tutor = mongoose.model("Tutor", schema);

module.exports = Tutor;
