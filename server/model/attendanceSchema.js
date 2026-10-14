/**
 * Attendance record for a single day and lunch period.
 */

const mongoose = require('mongoose');
const { ATTENDANCE_STATUSES } = require('../utils/attendance');

const attendanceSchema = new mongoose.Schema(
  {
    // Date of the attendance form
    date: {
      type: Date,
      required: true,
    },
    // Lunch period the attendance applies to
    lunchPeriod: {
      type: Number,
      required: true,
    },
    // Per-tutor attendance entries captured on the form
    tutors: [
      {
        // tutor's student ID number (Tutor.tutorID)
        tutorId: {
          type: Number,
          required: true,
        },
        // tutor first name
        tutorFirstName: {
          type: String,
          required: true,
          trim: true,
        },
        // tutor last name
        tutorLastName: {
          type: String,
          required: true,
          trim: true,
        },
        // tutor email
        email: {
          type: String,
          required: true,
          trim: true,
        },
        // 'present', 'tardy', 'absent', or 'makeup'
        status: {
          type: String,
          enum: ATTENDANCE_STATUSES,
          required: true,
        },
        // If this makeup is to cover a future planned absence, include that date
        futureMakeup: {
          type: Boolean,
          default: false,
        },
        futureAbsenceDate: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ date: 1, lunchPeriod: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
