const mongoose = require("mongoose");

const tutorSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  attendance: { type: Number, default: 0 },
});

module.exports = mongoose.model("Tutor", tutorSchema);
