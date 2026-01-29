/**
 * Attendance record for a single day and lunch period.
 */

const mongoose = require('mongoose');

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
        // tutor unique ID
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
        // 'present', 'absent', or 'makeup'
        status: {
          type: String,
          enum: ['present', 'absent', 'makeup'],
          required: true,
        },
      },
    ],
    // Optional: User who recorded the attendance (unsure if we will include this)
    // recordedBy: {
    //   type: String,
    //   trim: true,
    // },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ date: 1, lunchPeriod: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

