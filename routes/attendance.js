const express = require('express');
const router = express.Router();
const Tutor = require('../server/model/tutor'); // Fixed path to match project structure
const Attendance = require('../server/model/attendanceSchema'); // Import Attendance schema

// Route to render the attendance page
router.get('/', async (req, res) => {
  try {
    // Find all tutors and sort by last name
    const tutors = await Tutor.find().sort({ tutorLastName: 1 });

    // Convert MongoDB objects to objects formatted for the EJS template
    const tutorsFormatted = tutors.map(tutor => {
      console.log(
        'Tutor lunch period type:',
        typeof tutor.lunchPeriod,
        'Value:',
        tutor.lunchPeriod
      );

      return {
        _id: tutor._id,
        tutorFirstName: tutor.tutorFirstName || 'Unknown',
        tutorLastName: tutor.tutorLastName || 'Unknown',
        attendance: tutor.attendance || 0,
        daysAvailable: Array.isArray(tutor.daysAvailable) ? tutor.daysAvailable : [],
        lunchPeriod: tutor.lunchPeriod ? tutor.lunchPeriod.toString() : 'Not Set',
      };
    });

    console.log('Total tutors formatted:', tutorsFormatted.length);

    res.render('attendance', { tutors: tutorsFormatted });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving tutors');
  }
});

// Route to update attendance
router.post('/updateAttendance', async (req, res) => {
  const { tutorId, change } = req.body;
  try {
    // Use 'attendance' field to track days missed
    const updatedTutor = await Tutor.findByIdAndUpdate(
      tutorId,
      { $inc: { attendance: change } },
      { new: true } // Return the updated document
    );

    res.status(200).json({
      success: true,
      attendance: updatedTutor.attendance || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error updating attendance',
    });
  }
});

// Save attendance for a lunch period
router.post('/logSubmission', async (req, res) => {
  try {
    const { date, lunchPeriod, tutors } = req.body;

    // Validate required fields
    if (!date || !lunchPeriod || !tutors) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: date, lunchPeriod, or tutors',
      });
    }

    // Create or update attendance record for this date and lunch period
    const attendanceRecord = await Attendance.findOneAndUpdate(
      { date: new Date(date), lunchPeriod: parseInt(lunchPeriod) },
      {
        date: new Date(date),
        lunchPeriod: parseInt(lunchPeriod),
        tutors: tutors,
      },
      { upsert: true, new: true }
    );

    console.log('Attendance saved successfully:', attendanceRecord);
    res.json({ success: true, data: attendanceRecord });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Error saving attendance data',
    });
  }
});

// Get attendance by date and lunch period
router.get('/getAttendance', async (req, res) => {
  try {
    const { date, lunchPeriod } = req.query;

    // Validate required fields
    if (!date || !lunchPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: date and lunchPeriod',
      });
    }

    // Create date range for the entire day (to match any time on that date)
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Find attendance record for the given date range and lunch period
    const attendanceRecord = await Attendance.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      lunchPeriod: parseInt(lunchPeriod),
    });

    if (!attendanceRecord) {
      return res.json({
        success: true,
        data: null,
        message: 'There is no data for that selected date and lunch period.',
      });
    }

    res.json({ success: true, data: attendanceRecord });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching attendance data',
    });
  }
});

module.exports = router;

