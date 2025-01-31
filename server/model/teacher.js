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
  // if teacher is an admin
  admin: {
    type: Boolean,
    required: true,
  },
});

const Teacher = mongoose.model("Teacher", schema);

module.exports = Teacher;
