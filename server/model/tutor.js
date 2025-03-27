/**
 * schema for a Tutoring Session
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  // tutor last name
  tutorFirstName: {
    type: String,
    required: true,
  },
  // tutor first name
  tutorLastName: {
    type: String,
    required: true,
  },
  // ID number of tutor
  tutorID: {
    type: Number,
    required: true,
  },
  // tutor email
  email: {
    type: String,
    required: true,
  },
  // grade of tutor
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
  lunchPeriod: {
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
  // attendance of tutor (number of days attended)
  attendance: {
    type: Number,
    required: true,
    default: 0,
  },
  // number of days missed by the tutor
  daysMissed: {
    type: Number,
    required: true,
    default: 0,
  },
  // session history of tutor
  sessionHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ses",
    },
  ],
});

const Tutor = mongoose.model("Tutor", schema);

module.exports = Tutor;
