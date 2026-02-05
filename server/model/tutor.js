/**
 * schema for a Tutor
 */

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // Role assigned by admin: 'student', 'tutor', 'lead', 'teacher', 'admin', 'developer'
  // 'developer' has access to all permissions
  role: {
    type: String,
    enum: ['student', 'tutor', 'lead', 'teacher', 'admin', 'developer'],
    default: 'tutor',
  },

  // Google OAuth subject ID (for future use)
  googleId: {
    type: String,
    sparse: true,
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },

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
  // attendance of tutor number of day missed
  attendance: {
    type: Number,
    required: true,
  },
  // session history of tutor
  sessionHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session', // Corrected reference to match the model name
    },
  ],
});

const Tutor = mongoose.model('Tutor', schema);

module.exports = Tutor;
