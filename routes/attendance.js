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
        tutorID: tutor.tutorID,
        email: tutor.email,
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
    // Use 'attendance' field to track days missed (positive = absences)
    const updatedTutor = await Tutor.findByIdAndUpdate(
      tutorId,
      { $inc: { attendance: change } },
      { new: true } // Return the updated document
    );

    // Ensure attendance doesn't go below 0
    if (updatedTutor.attendance < 0) {
      updatedTutor.attendance = 0;
      await updatedTutor.save();
    }

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
    const { date, lunchPeriod, tutors, sendNotifications = false } = req.body;

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

    // If sendNotifications is enabled, notify absent tutors
    let notificationResults = null;
    if (sendNotifications) {
      const absentTutors = tutors.filter(t => t.status === 'absent');
      if (absentTutors.length > 0) {
        try {
          const notifyResponse = await fetch(
            `${req.protocol}://${req.get('host')}/api/notifications/absence`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: new Date(date).toLocaleDateString(),
                tutors: await Promise.all(
                  absentTutors.map(async t => {
                    // Look up actual absence count from the Tutor model
                    const tutorRecord = await Tutor.findOne({ tutorID: t.tutorId });
                    return {
                      email: t.email,
                      name: `${t.tutorFirstName} ${t.tutorLastName}`,
                      absenceCount: tutorRecord ? tutorRecord.attendance || 0 : 1,
                    };
                  })
                ),
              }),
            }
          );
          notificationResults = await notifyResponse.json();
        } catch (notifyError) {
          console.error('Error sending absence notifications:', notifyError);
          notificationResults = { error: 'Failed to send notifications' };
        }
      }
    }

    console.log('Attendance saved successfully:', attendanceRecord);
    res.json({ success: true, data: attendanceRecord, notifications: notificationResults });
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

    // Create date range for the entire day (Central Standard Time)
    const startOfDay = new Date(date + 'T00:00:00-06:00');
    const endOfDay = new Date(date + 'T23:59:59-06:00');

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

// Update attendance status for a tutor in an existing attendance record
router.post('/updateTutorStatus', async (req, res) => {
  try {
    const { attendanceId, tutorId, newStatus } = req.body;

    // Validate required fields
    if (!attendanceId || tutorId === undefined || !newStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: attendanceId, tutorId, or newStatus',
      });
    }

    // Validate status value
    const validStatuses = ['present', 'absent', 'makeup'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: present, absent, makeup',
      });
    }

    // Find and update the specific tutor's status in the attendance record
    const updatedRecord = await Attendance.findOneAndUpdate(
      {
        _id: attendanceId,
        'tutors.tutorId': tutorId,
      },
      {
        $set: { 'tutors.$.status': newStatus },
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record or tutor not found',
      });
    }

    console.log(`Updated tutor ${tutorId} status to ${newStatus} in attendance ${attendanceId}`);
    res.json({ success: true, data: updatedRecord });
  } catch (error) {
    console.error('Error updating tutor status:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating tutor status',
    });
  }
});

// Bulk update attendance statuses for multiple tutors
router.post('/bulkUpdateStatus', async (req, res) => {
  try {
    const { attendanceId, updates } = req.body;

    // Validate required fields
    if (!attendanceId || !updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: attendanceId or updates array',
      });
    }

    // Validate all status values
    const validStatuses = ['present', 'absent', 'makeup'];
    for (const update of updates) {
      if (!validStatuses.includes(update.newStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status "${update.newStatus}". Must be one of: present, absent, makeup`,
        });
      }
    }

    // Update each tutor's status using MongoDB _id for matching
    // The frontend now sends the subdocument _id as tutorId
    let updatedCount = 0;
    for (const update of updates) {
      console.log(
        `Attempting to update tutor _id: ${update.tutorId} to status: ${update.newStatus}`
      );

      // Use findOneAndUpdate with the subdocument _id
      const result = await Attendance.findOneAndUpdate(
        {
          _id: attendanceId,
          'tutors._id': update.tutorId,
        },
        {
          $set: { 'tutors.$.status': update.newStatus },
        },
        { new: true }
      );

      if (result) {
        updatedCount++;
        console.log(`Updated tutor ${update.tutorId} to status ${update.newStatus}`);
      } else {
        console.log(`Tutor ${update.tutorId} not found in attendance record ${attendanceId}`);
      }
    }

    // Fetch the final updated record to return
    const updatedRecord = await Attendance.findById(attendanceId);

    console.log(
      `Bulk updated ${updatedCount}/${updates.length} tutor statuses in attendance ${attendanceId}`
    );
    res.json({ success: true, data: updatedRecord, updatedCount });
  } catch (error) {
    console.error('Error bulk updating tutor statuses:', error);
    res.status(500).json({
      success: false,
      error: 'Error bulk updating tutor statuses',
    });
  }
});

module.exports = router;
