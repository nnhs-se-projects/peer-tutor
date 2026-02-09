/**
 * Schema for a Tutoring Request from a student
 */

const mongoose = require('mongoose');

const tutoringRequestSchema = new mongoose.Schema(
  {
    // Student information
    studentEmail: {
      type: String,
      required: true,
      trim: true,
    },
    studentFirstName: {
      type: String,
      trim: true,
      default: 'Student',
    },
    studentLastName: {
      type: String,
      trim: true,
      default: '',
    },
    studentID: {
      type: String,
      trim: true,
    },

    // Requested tutor information (optional - student may not have selected a specific tutor)
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
    },
    tutorName: {
      type: String,
      trim: true,
    },
    tutorEmail: {
      type: String,
      trim: true,
    },

    // Request details
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    preferredPeriod: {
      type: String,
      required: true,
    },
    additionalNotes: {
      type: String,
      trim: true,
    },

    // Request status: pending, accepted, declined, completed
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending',
    },

    // Tutor's response message (optional)
    responseMessage: {
      type: String,
      trim: true,
    },

    // When the tutor responded
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for quick lookups by tutor
tutoringRequestSchema.index({ tutorId: 1, status: 1 });
tutoringRequestSchema.index({ studentEmail: 1 });

const TutoringRequest = mongoose.model('TutoringRequest', tutoringRequestSchema);

module.exports = TutoringRequest;
