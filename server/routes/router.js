const express = require('express');
const route = express.Router();
const Entry = require('../model/entry');
const Session = require('../model/session'); // Import the Session schema
const Tutor = require('../model/tutor'); // Import the Tutor schema
const TutoringRequest = require('../model/tutoringRequest'); // Import the TutoringRequest schema
const nodemailer = require('nodemailer');

// assigning variable to the JSON file
const gradeSelection = require('../model/grades.json');

const newReturningOptions = require('../model/newReturningOptions.json');
const lunchPeriods = require('../model/lunchPeriods.json');
const daysOfTheWeek = require('../model/daysOfTheWeek.json');

// assigning variables to the JSON files
const courseList = require('../model/courseList.json');
const courses = require('../model/courses.json');

// Route to render the authentication page
route.get('/auth', (req, res) => {
  res.render('auth'); // Render the 'auth' EJS template
});

route.get('/', async (req, res) => {
  // the req parameter references the HTTP request object, which has
  //  a number of properties
  console.log('path: ', req.path);

  try {
    const tutors = await Tutor.find(); // Fetch tutors from the database

    const formattedTutors = tutors.map(tutor => ({
      firstName: tutor.tutorFirstName || 'Unknown',
      lastName: tutor.tutorLastName || 'Tutor',
      totalSessions: tutor.sessionHistory?.length || 0,
      email: tutor.email,
    }));

    // Sort tutors by totalSessions in descending order
    formattedTutors.sort((a, b) => b.totalSessions - a.totalSessions);

    // Get top 3 tutors from the already sorted array
    const top3 = formattedTutors.slice(0, 3);

    // the res parameter references the HTTP response object
    res.render('homepage', {
      tutors: formattedTutors,
      top3: top3,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error('Error rendering homepage:', error);
    res.status(500).send('Error loading the homepage. Please try again later.');
  }
});

// route to render classes, grades
route.get('/tutHome', (req, res) => {
  res.render('tutHome');
});

// route to student home page
route.get('/stuHome', async (req, res) => {
  res.render('stuHome');
});

// API endpoints for student functionality

// Get tutors based on subject/class
route.get('/api/tutors', async (req, res) => {
  try {
    const { subject, class: className } = req.query;

    // Validate required parameters
    if (!subject || !className) {
      return res.status(400).json({
        success: false,
        error: 'Subject and class are required parameters',
      });
    }

    // Query tutors who can teach the specified class
    const tutors = await Tutor.find({
      classes: { $elemMatch: { $regex: className, $options: 'i' } },
    });

    // Return the tutors
    res.json(tutors);
  } catch (error) {
    console.error('Error finding tutors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find tutors',
    });
  }
});

// Get session history for the current student
route.get('/api/student/sessions', async (req, res) => {
  try {
    // Get student email from session
    const studentEmail = req.session.email;

    if (!studentEmail) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Query sessions where tutee email matches current user
    // For now, we'll return sessions based on tuteeID since email might not be stored
    // In a real app, you'd match by email or user ID
    const sessions = await Session.find({}).sort({ sessionDate: -1 }).limit(10);

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching student sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
    });
  }
});

// Submit a tutoring request
route.post('/api/tutoringRequest', async (req, res) => {
  try {
    const {
      subject,
      class: className,
      topic,
      preferredDate,
      preferredPeriod,
      additionalNotes,
      tutorId,
      tutorName,
    } = req.body;

    // Validate required fields
    if (!subject || !className || !topic || !preferredDate || !preferredPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Get student email from session
    const studentEmail = req.session.email;

    if (!studentEmail) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Get tutor email if tutorId is provided
    let tutorEmail = null;
    if (tutorId) {
      const tutor = await Tutor.findById(tutorId);
      if (tutor) {
        tutorEmail = tutor.email;
      }
    }

    // Create new tutoring request
    const newRequest = new TutoringRequest({
      studentEmail: studentEmail,
      studentFirstName: req.session.firstName || 'Student',
      studentLastName: req.session.lastName || '',
      studentID: req.session.studentID || '',
      tutorId: tutorId || null,
      tutorName: tutorName || null,
      tutorEmail: tutorEmail,
      subject: subject,
      class: className,
      topic: topic,
      preferredDate: new Date(preferredDate),
      preferredPeriod: preferredPeriod,
      additionalNotes: additionalNotes || '',
      status: 'pending',
    });

    await newRequest.save();

    res.json({ success: true, requestId: newRequest._id });
  } catch (error) {
    console.error('Error creating tutoring request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tutoring request',
    });
  }
});

// Get tutoring requests for a specific tutor (by tutor ID number)
route.get('/api/tutor/requests', async (req, res) => {
  try {
    const tutorID = req.query.tutorID;

    if (!tutorID) {
      return res.status(400).json({
        success: false,
        error: 'Tutor ID is required',
      });
    }

    // First find the tutor by their ID number to get their MongoDB _id
    const tutor = await Tutor.findOne({ tutorID: parseInt(tutorID) });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: 'Tutor not found',
      });
    }

    // Find all requests for this tutor
    const requests = await TutoringRequest.find({
      tutorId: tutor._id,
      status: { $in: ['pending', 'accepted'] },
    }).sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching tutor requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests',
    });
  }
});

// Update tutoring request status (accept/decline)
route.post('/api/tutor/requests/:requestId/respond', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "accepted" or "declined"',
      });
    }

    const request = await TutoringRequest.findByIdAndUpdate(
      requestId,
      {
        status: status,
        responseMessage: responseMessage || '',
        respondedAt: new Date(),
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update request',
    });
  }
});

// route to tutor leader home page
route.get('/leadHome', async (req, res) => {
  res.render('leadHome');
});

// route to teacher home page
route.get('/teachHome', async (req, res) => {
  res.render('teachHome');
});

// route to admin home page
route.get('/adminHome', async (req, res) => {
  res.render('adminHome');
});

// route to a simple notification test page
route.get('/notifications', (req, res) => {
  res.render('notifications', {
    userEmail: req.session.email || '',
  });
});

// route to expertise form page
route.get('/expertiseForm', async (req, res) => {
  res.render('expertiseForm', {
    grades: gradeSelection,
    options: newReturningOptions,
    lunchPeriods,
    daysOfTheWeek,
    courseList,
  });
});

// delegate all authentication to the auth.js router
route.use('/auth', require('./auth'));

// Route to render the tutor attendance
route.get('/tutorAttendance', async (req, res) => {
  res.render('tutorAttendance');
});

// Route to render the tutor form
route.get('/tutorForm', async (req, res) => {
  res.render('tutorForm');
});

// Route to handle tutor form submission
route.post('/submitTutorForm', async (req, res) => {
  try {
    console.log(req.body);
    const newSession = new Session({
      tutorFirstName: req.body.tutorFirstName,
      tutorLastName: req.body.tutorLastName,
      tutorID: req.body.tutorID,
      sessionDate: req.body.sessionDate,
      sessionPeriod: req.body.sessionPeriod,
      sessionPlace: req.body.sessionPlace,
      subject: req.body.subject,
      class: req.body.class,
      teacher: req.body.teacher,
      focusOfSession: req.body.focusOfSession,
      workAccomplished: req.body.workAccomplished,
      tuteeFirstName: req.body.tuteeFirstName,
      tuteeLastName: req.body.tuteeLastName,
      tuteeID: req.body.tuteeID,
      tuteeGrade: req.body.tuteeGrade,
    });
    const savedSession = await newSession.save();
    res.json({ success: true });
    console.log('saved object ID: ', savedSession._id.toString());
    const tutor = await Tutor.findOne({ tutorID: req.body.tutorID });
    if (!tutor) {
      console.log('Tutor not found');
    } else {
      console.log('Tutor found:', tutor);
    }

    // add the session to the tutor's session history
    tutor.sessionHistory.push(savedSession._id);
    await tutor.save();
    console.log("Session added to tutor's session history");
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ success: false, error: 'Failed to save session' });
  }
});

// Route to handle expertise form submission
route.post('/submitExpertiseForm', async (req, res) => {
  try {
    const {
      tutorFirstName,
      tutorLastName,
      tutorID,
      email,
      grade,
      returning,
      lunchPeriod,
      daysAvailable,
      classes,
      tutorLeader,
      attendance,
    } = req.body;

    // If a tutor with this ID exists, update instead of creating a duplicate
    const existingTutor = await Tutor.findOne({ tutorID });

    if (existingTutor) {
      existingTutor.tutorFirstName = tutorFirstName;
      existingTutor.tutorLastName = tutorLastName;
      existingTutor.email = email;
      existingTutor.grade = grade;
      existingTutor.returning = returning;
      existingTutor.lunchPeriod = lunchPeriod;
      existingTutor.daysAvailable = daysAvailable;
      existingTutor.classes = classes;
      existingTutor.tutorLeader = tutorLeader;
      existingTutor.attendance = attendance;

      await existingTutor.save();
      return res.json({ success: true, updated: true });
    }

    const newTutor = new Tutor({
      tutorFirstName,
      tutorLastName,
      tutorID,
      email,
      grade,
      returning,
      lunchPeriod,
      daysAvailable,
      classes,
      tutorLeader,
      attendance,
      sessionHistory: [],
    });
    await newTutor.save();
    res.json({ success: true, created: true });
  } catch (error) {
    console.error('Error saving expertise sheet:', error);
    res.status(500).json({ success: false, error: 'Failed to save expertise sheet' });
  }
});

route.get('/tutorTable', async (req, res) => {
  try {
    const tutors = await Tutor.find().sort({ date: -1 });

    // Convert MongoDB objects to objects formatted for the EJS template
    const tutorsFormatted = tutors.map(tutor => {
      return {
        id: tutor._id.toString(),
        tutorName: `${tutor.tutorFirstName} ${tutor.tutorLastName}`,
        email: tutor.email,
        date: tutor.date,
        grade: tutor.grade,
        tutorID: tutor.tutorID,
        classes: Array.isArray(tutor.classes) ? tutor.classes : [],
        daysAvailable: Array.isArray(tutor.daysAvailable) ? tutor.daysAvailable : [],
        lunchPeriod: tutor.lunchPeriod,
        totalSessions: tutor.sessionHistory.length,
      };
    });

    res.render('tutorTable', { tutors: tutorsFormatted });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    res.status(500).send('Error fetching tutors');
  }
});

route.get('/sessionTable', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ date: -1 });

    // Convert MongoDB objects to objects formatted for the EJS template
    const sessionsFormatted = sessions.map(session => {
      return {
        date: session.sessionDate
          ? new Date(session.sessionDate).toLocaleDateString('en-US', {
              timeZone: 'America/Chicago',
            })
          : null,
        tuteeName: `${session.tuteeFirstName} ${session.tuteeLastName}`,
        tuteeID: session.tuteeID,
        tutorName: `${session.tutorFirstName} ${session.tutorLastName}`,
        subject: session.subject,
        class: session.class,
        teacher: session.teacher || 'Not Specified',
        assignment: session.workAccomplished,
      };
    });

    res.render('sessionTable', { sessions: sessionsFormatted });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).send('Error fetching sessions');
  }
});

// Route to render the attendance
route.get('/attendance', async (req, res) => {
  try {
    const tutors = await Tutor.find().sort({ date: -1 });

    // Convert MongoDB objects to objects formatted for the EJS template
    const tutorsFormatted = tutors.map(tutor => {
      return {
        firstName: tutor.tutorFirstName,
        lastName: tutor.tutorLastName,
        date: tutor.date,
        attendance: tutor.attendance,
        daysAvailable: Array.isArray(tutor.daysAvailable) ? tutor.daysAvailable : [],
        lunchPeriod: tutor.lunchPeriod,
      };
    });

    res.render('attendance', { tutors: tutorsFormatted });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    res.status(500).send('Error fetching tutors');
  }
});

route.post('/updateAttendance/:id', async (req, res) => {
  try {
    const tutorId = req.params.id;
    const { change, columnToUpdate } = req.body;

    // Find the tutor by ID
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    // Update attendance
    tutor.attendance += change;

    // Update "Days Missed" if the columnToUpdate is "daysMissed"
    if (columnToUpdate === 'daysMissed') {
      tutor.daysMissed = (tutor.daysMissed || 0) + 1;
    }

    await tutor.save(); // Save the updated tutor

    res.json({
      attendance: tutor.attendance,
      daysMissed: tutor.daysMissed || 0,
    }); // Send the updated data back to the client
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import external route files
route.use('/attendance', require('../../routes/attendance'));

// The homepage route can be handled in the main router
// Removing duplicate route for /homepage

// API endpoint to get tutor attendance data
route.get('/api/tutor-attendance/:id', async (req, res) => {
  try {
    const tutorID = parseInt(req.params.id); // Convert string to number

    // Find the tutor in the database
    const tutorData = await Tutor.findOne({ tutorID: tutorID });

    if (!tutorData) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    // Get tutor's sessions
    const sessions = await Session.find({ tutorID: tutorID.toString() }).sort({ sessionDate: -1 });

    const response = {
      name: `${tutorData.tutorFirstName} ${tutorData.tutorLastName}`,
      daysMissed: tutorData.attendance || 0,
      sessionCount: sessions.length,
      sessions: sessions.map(session => ({
        date: session.sessionDate,
        subject: session.subject,
        student: `${session.tuteeFirstName} ${session.tuteeLastName}`,
        duration: session.sessionPeriod,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching tutor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get courses for subject/class dropdowns
route.get('/api/courses', (req, res) => {
  res.json(courses);
});

// API endpoint to delete a tutor by id
route.post('/api/tutors/delete', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing tutor id' });
  }

  try {
    const deleted = await Tutor.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tutor not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tutor:', error);
    res.status(500).json({ success: false, error: 'Failed to delete tutor' });
  }
});

// API endpoint to list tutor names and emails for notifications
route.get('/api/tutor-emails', async (req, res) => {
  try {
    const tutors = await Tutor.find({ email: { $exists: true, $ne: '' } })
      .select('tutorFirstName tutorLastName email lunchPeriod classes')
      .sort({ tutorLastName: 1, tutorFirstName: 1 });

    const results = tutors.map(tutor => ({
      name: `${tutor.tutorFirstName || 'Unknown'} ${tutor.tutorLastName || 'Tutor'}`.trim(),
      email: tutor.email,
      lunchPeriod: tutor.lunchPeriod,
      classes: Array.isArray(tutor.classes) ? tutor.classes : [],
    }));

    res.json({ success: true, tutors: results });
  } catch (error) {
    console.error('Error fetching tutor emails:', error);
    res.status(500).json({ success: false, error: 'Failed to load tutor emails' });
  }
});

// API endpoint to send a notification email (supports one or many recipients)
route.post('/api/notifications/send', async (req, res) => {
  const { to, subject, message } = req.body;

  const recipientList = Array.isArray(to)
    ? to.map(addr => (typeof addr === 'string' ? addr.trim() : '')).filter(Boolean)
    : (typeof to === 'string' ? [to.trim()] : []).filter(Boolean);

  if (!recipientList.length || !subject || !message) {
    return res
      .status(400)
      .json({ success: false, error: 'Missing recipients, subject, or message' });
  }

  const senderEmail = process.env.EMAIL_SENDER;
  const senderPassword = process.env.EMAIL_PASSWORD;

  if (!senderEmail || !senderPassword) {
    return res.status(500).json({
      success: false,
      error: 'Email credentials not configured. Set EMAIL_SENDER and EMAIL_PASSWORD.',
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: senderPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: senderEmail,
      to: recipientList,
      subject,
      text: message,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending notification email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// Helper function to send absence notification emails (reusable)
async function sendAbsenceNotification(tutorEmail, tutorName, date, absenceCount) {
  const senderEmail = process.env.EMAIL_SENDER;
  const senderPassword = process.env.EMAIL_PASSWORD;

  if (!senderEmail || !senderPassword) {
    throw new Error('Email credentials not configured');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: senderPassword,
    },
  });

  const subject = `Peer Tutoring: Absence Recorded - ${date}`;
  const message = `Hello ${tutorName},

This is an automated notification to inform you that you were marked absent from your peer tutoring session on ${date}.

Your current total absences: ${absenceCount}

If you believe this was recorded in error, please contact your tutor lead or teacher coordinator.

${absenceCount >= 2 ? '⚠️ Please note: You have 2 or more absences. Please make arrangements with your tutor lead to make up missed sessions.' : ''}

Thank you,
Peer Tutoring Program`;

  await transporter.sendMail({
    from: senderEmail,
    to: tutorEmail,
    subject,
    text: message,
  });

  return true;
}

// API endpoint to send absence notifications for specific tutors
route.post('/api/notifications/absence', async (req, res) => {
  const { tutors, date } = req.body;

  if (!tutors || !Array.isArray(tutors) || !tutors.length) {
    return res.status(400).json({ success: false, error: 'Missing tutors array' });
  }

  const results = { sent: [], failed: [] };

  for (const tutor of tutors) {
    try {
      if (!tutor.email) {
        results.failed.push({ name: tutor.name || 'Unknown', reason: 'No email address' });
        continue;
      }

      await sendAbsenceNotification(
        tutor.email,
        tutor.name || 'Tutor',
        date || new Date().toLocaleDateString(),
        tutor.absenceCount || 1
      );

      results.sent.push({ name: tutor.name, email: tutor.email });
    } catch (error) {
      console.error(`Failed to send absence notification to ${tutor.email}:`, error);
      results.failed.push({
        name: tutor.name || 'Unknown',
        email: tutor.email,
        reason: error.message,
      });
    }
  }

  res.json({
    success: true,
    message: `Sent ${results.sent.length} notification(s), ${results.failed.length} failed`,
    results,
  });
});

// API endpoint to get tutors with outstanding absences (1 or more missed days)
route.get('/api/tutors/absences', async (req, res) => {
  try {
    const minAbsences = parseInt(req.query.min) || 1;

    // Query using daysMissed field which tracks actual absences
    // Also include tutors with negative attendance (meaning net absences)
    const tutorsWithAbsences = await Tutor.find({
      $or: [
        { daysMissed: { $gte: minAbsences } },
        { attendance: { $lte: -minAbsences } }, // negative attendance = missed days
      ],
      email: { $exists: true, $ne: '' },
    })
      .select('tutorFirstName tutorLastName email attendance daysMissed lunchPeriod')
      .sort({ daysMissed: -1, attendance: 1 });

    const results = tutorsWithAbsences.map(tutor => ({
      name: `${tutor.tutorFirstName || 'Unknown'} ${tutor.tutorLastName || 'Tutor'}`.trim(),
      email: tutor.email,
      // Use daysMissed if available, otherwise use absolute value of negative attendance
      absenceCount: tutor.daysMissed || (tutor.attendance < 0 ? Math.abs(tutor.attendance) : 0),
      lunchPeriod: tutor.lunchPeriod,
    }));

    // Filter out any tutors with 0 absences after calculation
    const filteredResults = results.filter(t => t.absenceCount >= minAbsences);

    res.json({ success: true, tutors: filteredResults });
  } catch (error) {
    console.error('Error fetching tutors with absences:', error);
    res.status(500).json({ success: false, error: 'Failed to load tutors with absences' });
  }
});

// API endpoint to notify all tutors with outstanding absences
route.post('/api/notifications/absence/bulk', async (req, res) => {
  try {
    const minAbsences = parseInt(req.body.minAbsences) || 1;

    // Query using daysMissed field or negative attendance
    const tutorsWithAbsences = await Tutor.find({
      $or: [{ daysMissed: { $gte: minAbsences } }, { attendance: { $lte: -minAbsences } }],
      email: { $exists: true, $ne: '' },
    }).select('tutorFirstName tutorLastName email attendance daysMissed');

    // Filter and calculate actual absence count
    const tutorsToNotify = tutorsWithAbsences
      .map(tutor => ({
        ...tutor.toObject(),
        absenceCount: tutor.daysMissed || (tutor.attendance < 0 ? Math.abs(tutor.attendance) : 0),
      }))
      .filter(t => t.absenceCount >= minAbsences);

    if (!tutorsToNotify.length) {
      return res.json({
        success: true,
        message: 'No tutors with outstanding absences found',
        results: { sent: [], failed: [] },
      });
    }

    const results = { sent: [], failed: [] };

    for (const tutor of tutorsToNotify) {
      const tutorName =
        `${tutor.tutorFirstName || ''} ${tutor.tutorLastName || ''}`.trim() || 'Tutor';
      try {
        await sendAbsenceNotification(
          tutor.email,
          tutorName,
          new Date().toLocaleDateString(),
          tutor.absenceCount
        );
        results.sent.push({ name: tutorName, email: tutor.email, absences: tutor.absenceCount });
      } catch (error) {
        console.error(`Failed to notify ${tutor.email}:`, error);
        results.failed.push({ name: tutorName, email: tutor.email, reason: error.message });
      }
    }

    res.json({
      success: true,
      message: `Notified ${results.sent.length} tutor(s) with ${minAbsences}+ absences`,
      results,
    });
  } catch (error) {
    console.error('Error sending bulk absence notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to send bulk notifications' });
  }
});

route.get('/adminAttendance', (req, res) => {
  res.render('adminAttendance');
});

module.exports = route;
