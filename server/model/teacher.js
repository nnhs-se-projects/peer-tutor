/**
 * schema for a Tutoring Session
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  // teacher email
  email: {
    type: String,
    required: true,
  },
  // teacher first name
  teacherFirstName: {
    type: String,
    required: true,
  },
  // teacher last name
  teacherLastName: {
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
