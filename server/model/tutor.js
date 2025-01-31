/**
 * schema for a Tutoring Session
 */

const mongoose = require("mongoose");
const sesh = require("./session");

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

  // if tutor is returning or not
  returning: {
    type: Boolean,
    required: true,
  },

  // lunch period of tutor
  period: {
    type: Number,
    required: true,
  },
  // days tutor is available
  daysAvailable: {
    type: [String],
    required: true,
  },

  // classes tutor is able to tutor
  classes: {
    type: [String],
    required: true,
  },

  // if tutor is tutorLeader or not
  tutorLeader: {
    type: Boolean,
    required: true,
  },
  // attendance of tutee number of day missed
  attendance: {
    type: Number,
    required: true,
  },
  // session history of tutee
  sessionHistory: {
    type: [sesh],
    required: true,
  },
});

const Tutor = mongoose.model("Tutor", schema);

module.exports = Tutor;
