/**
 * schema for a Tutoring Session
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  // tutee email
  email: {
    type: String,
    required: true,
  },
  // tutee last name
  last: {
    type: String,
    required: true,
  },
  // tutee first name
  first: {
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
  // session history of tutee
  sessionHistory: {
    type: [session],
    required: true,
  },
});

const Tutee = mongoose.model("Tutee", schema);

module.exports = Tutee;
