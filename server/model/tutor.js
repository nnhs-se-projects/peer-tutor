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

  // Inactive tutors sign in as students and are left off attendance
  isActive: {
    type: Boolean,
    default: true,
  },

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
  // ID number of tutor
  tutorID: {
    type: Number,
    required: true,
  },
  // tutor email (the Google account they sign in with)
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
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
  // days missed: absences (+1) and tardies (+0.5) minus makeups (-1)
  attendance: {
    type: Number,
    required: true,
  },
  // session history of tutor
  sessionHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
    },
  ],
  // sessions completed before they were logged on this site
  pastSessionCount: {
    type: Number,
    default: 0,
  },
});

// Total shown on the leaderboard and tutor pages
schema.virtual('totalSessions').get(function () {
  return (this.sessionHistory ? this.sessionHistory.length : 0) + (this.pastSessionCount || 0);
});

const Tutor = mongoose.model('Tutor', schema);

module.exports = Tutor;
