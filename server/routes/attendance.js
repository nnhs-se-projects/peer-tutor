/**
 * Attendance page and API (mounted at /attendance).
 *
 * Tutor.attendance holds each tutor's days missed. Every change to an attendance record
 * adjusts that counter by the difference between the old and new status weights.
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Tutor = require('../model/tutor');
const Attendance = require('../model/attendanceSchema');
const { requireRole } = require('../middleware/roleAuth');
const asyncRoute = require('../middleware/asyncRoute');
const { ATTENDANCE_STATUSES, statusWeight } = require('../utils/attendance');
const { getAttendanceDayRange, parseDateOnly, weekdayInSchoolZone } = require('../utils/dates');

// Weight of each tutor's status in an attendance record, keyed by tutor ID
const weightsByTutor = entries => {
  const weights = new Map();
  (entries || []).forEach(entry => weights.set(entry.tutorId, statusWeight(entry.status)));
  return weights;
};

// Add the change in days missed to each tutor's counter
async function applyAttendanceChanges(oldEntries, newEntries) {
  const oldWeights = weightsByTutor(oldEntries);
  const newWeights = weightsByTutor(newEntries);
  const tutorIds = new Set([...oldWeights.keys(), ...newWeights.keys()]);

  const updates = [];
  for (const tutorId of tutorIds) {
    // A tutor missing from the new record counts as present
    const change = (newWeights.get(tutorId) || 0) - (oldWeights.get(tutorId) || 0);
    if (change !== 0) {
      updates.push(Tutor.updateOne({ tutorID: tutorId }, { $inc: { attendance: change } }));
    }
  }
  await Promise.all(updates);
}

// Render the attendance page (lead and above)
router.get(
  '/',
  requireRole('lead'),
  asyncRoute(async (req, res) => {
    const todayName = weekdayInSchoolZone();

    const tutors = await Tutor.find({ isActive: { $ne: false } }).sort({
      tutorLastName: 1,
      tutorFirstName: 1,
    });

    const tutorsFormatted = tutors.map(tutor => ({
      _id: tutor._id,
      tutorFirstName: tutor.tutorFirstName || 'Unknown',
      tutorLastName: tutor.tutorLastName || 'Unknown',
      tutorID: tutor.tutorID,
      attendance: tutor.attendance || 0,
      daysAvailable: Array.isArray(tutor.daysAvailable) ? tutor.daysAvailable : [],
      lunchPeriod: tutor.lunchPeriod ? tutor.lunchPeriod.toString() : 'Not Set',
    }));

    // Makeups can only happen on a day the tutor isn't scheduled. Tutors with no absences
    // are included so leads can log future makeups; lunch filtering happens in the browser.
    const makeupTutors = tutorsFormatted.filter(tutor => !tutor.daysAvailable.includes(todayName));

    res.render('attendance', {
      tutors: tutorsFormatted,
      makeupTutors,
      currentDay: todayName,
      currentPage: 'attendance',
    });
  })
);

// Save attendance for a lunch period (lead and above)
router.post(
  '/logSubmission',
  requireRole('lead'),
  asyncRoute(async (req, res) => {
    const { date, tutors } = req.body;
    const lunchPeriod = Number(req.body.lunchPeriod);
    const dayRange = getAttendanceDayRange(date);

    if (!dayRange || !Number.isInteger(lunchPeriod) || !Array.isArray(tutors) || !tutors.length) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: date, lunchPeriod, or tutors',
      });
    }

    if (tutors.some(t => !ATTENDANCE_STATUSES.includes(t && t.status))) {
      return res.status(400).json({ success: false, error: 'Invalid attendance status' });
    }

    // Names and emails come from the tutor records, not from the browser
    const tutorIds = tutors.map(t => Number(t.tutorId));
    const tutorDocs = await Tutor.find({ tutorID: { $in: tutorIds } });
    const tutorsById = new Map(tutorDocs.map(doc => [doc.tutorID, doc]));
    if (tutorIds.some(id => !tutorsById.has(id))) {
      return res.status(400).json({
        success: false,
        error: 'The tutor list has changed. Please reload the page and try again.',
      });
    }

    const entries = tutors.map(t => {
      const tutor = tutorsById.get(Number(t.tutorId));
      const entry = {
        tutorId: tutor.tutorID,
        tutorFirstName: tutor.tutorFirstName,
        tutorLastName: tutor.tutorLastName,
        email: tutor.email,
        status: t.status,
      };
      if (t.status === 'makeup' && t.futureMakeup) {
        entry.futureMakeup = true;
        const futureAbsenceDate = parseDateOnly(t.futureAbsenceDate);
        if (futureAbsenceDate) entry.futureAbsenceDate = futureAbsenceDate;
      }
      return entry;
    });

    // Replace the day's record and get the previous version in one atomic step, so a
    // double submit or two people saving at once can't count the same absence twice.
    const filter = {
      date: { $gte: dayRange.start, $lte: dayRange.end },
      lunchPeriod,
    };
    const update = { $set: { date: dayRange.start, lunchPeriod, tutors: entries } };

    let previousRecord;
    try {
      previousRecord = await Attendance.findOneAndUpdate(filter, update, {
        upsert: true,
        new: false,
      });
    } catch (err) {
      // Another request created this day's record first; update that one instead
      if (err.code !== 11000) throw err;
      previousRecord = await Attendance.findOneAndUpdate(filter, update, { new: false });
    }

    await applyAttendanceChanges(previousRecord ? previousRecord.tutors : [], entries);

    res.json({ success: true });
  })
);

// Get attendance by date and lunch period (lead and above)
router.get(
  '/getAttendance',
  requireRole('lead'),
  asyncRoute(async (req, res) => {
    const dayRange = getAttendanceDayRange(req.query.date);
    const lunchPeriod = Number(req.query.lunchPeriod);

    if (!dayRange || !Number.isInteger(lunchPeriod)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: date and lunchPeriod',
      });
    }

    const attendanceRecord = await Attendance.findOne({
      date: { $gte: dayRange.start, $lte: dayRange.end },
      lunchPeriod,
    });

    if (!attendanceRecord) {
      return res.json({
        success: true,
        data: null,
        message: 'There is no data for that selected date and lunch period.',
      });
    }

    res.json({ success: true, data: attendanceRecord });
  })
);

// Change the status of tutors in an existing attendance record (admin and above)
router.post(
  '/bulkUpdateStatus',
  requireRole('admin'),
  asyncRoute(async (req, res) => {
    const { attendanceId, updates } = req.body;

    if (!mongoose.isObjectIdOrHexString(attendanceId) || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: attendanceId or updates array',
      });
    }

    for (const update of updates) {
      if (!ATTENDANCE_STATUSES.includes(update && update.newStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status "${update && update.newStatus}". Must be one of: ${ATTENDANCE_STATUSES.join(', ')}`,
        });
      }
    }

    let updatedCount = 0;
    for (const { entryId, newStatus } of updates) {
      if (!mongoose.isObjectIdOrHexString(entryId)) continue;

      // Read the old status in the same step as the change so the counter stays accurate
      const previousRecord = await Attendance.findOneAndUpdate(
        { _id: attendanceId, 'tutors._id': entryId },
        { $set: { 'tutors.$.status': newStatus } },
        { new: false }
      );
      if (!previousRecord) continue;

      const previousEntry = previousRecord.tutors.id(entryId);
      const change = statusWeight(newStatus) - statusWeight(previousEntry.status);
      if (change !== 0) {
        await Tutor.updateOne({ tutorID: previousEntry.tutorId }, { $inc: { attendance: change } });
      }
      updatedCount++;
    }

    const updatedRecord = await Attendance.findById(attendanceId);
    if (!updatedRecord) {
      return res.status(404).json({ success: false, error: 'Attendance record not found' });
    }

    res.json({ success: true, data: updatedRecord, updatedCount });
  })
);

module.exports = router;
