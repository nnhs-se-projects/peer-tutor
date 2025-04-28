const express = require('express');
const router = express.Router();
const Tutor = require('../server/model/tutor'); // Fixed path to match project structure

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

module.exports = router;
