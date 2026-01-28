const express = require('express');
const route = express.Router();
const Entry = require('../model/entry');
const Session = require('../model/session'); // Import the Session schema
const Tutor = require('../model/tutor'); // Import the Tutor schema
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

    // Create new tutoring request
    // This would typically be stored in a TutoringRequest model
    // For now, we'll create a placeholder session
    const newSession = new Session({
      tutorFirstName: 'To Be Assigned',
      tutorLastName: '',
      tutorID: '0',
      sessionDate: preferredDate,
      sessionPeriod: preferredPeriod,
      sessionPlace: 'To Be Determined',
      subject: subject,
      class: className,
      teacher: 'Not Specified',
      focusOfSession: topic,
      workAccomplished: additionalNotes || 'Not yet completed',
      tuteeFirstName: req.session.firstName || 'Student',
      tuteeLastName: req.session.lastName || 'User',
      tuteeID: req.session.studentID || '0',
      tuteeGrade: req.session.grade || '9',
    });

    await newSession.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error creating tutoring request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tutoring request',
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
        firstName: tutor.tutorFirstName,
        lastName: tutor.tutorLastName,
        tutorName: `${tutor.tutorFirstName} ${tutor.tutorLastName}`,
        email: tutor.email,
        date: tutor.date,
        grade: tutor.grade,
        tutorID: tutor.tutorID,
        classes: Array.isArray(tutor.classes) ? tutor.classes : [],
        daysAvailable: Array.isArray(tutor.daysAvailable) ? tutor.daysAvailable : [],
        lunchPeriod: tutor.lunchPeriod,
        returning: tutor.returning,
        tutorLeader: tutor.tutorLeader,
        attendance: tutor.attendance,
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
              timeZone: 'UTC',
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

// API endpoint to update a tutor by id
route.post('/api/tutors/update', async (req, res) => {
  const {
    id,
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

  if (!id || !tutorFirstName || !tutorLastName || !tutorID || !email || grade === undefined) {
    return res.status(400).json({ success: false, error: 'Missing required tutor fields' });
  }

  try {
    const updated = await Tutor.findByIdAndUpdate(
      id,
      {
        tutorFirstName,
        tutorLastName,
        tutorID,
        email,
        grade,
        returning,
        lunchPeriod,
        daysAvailable: Array.isArray(daysAvailable) ? daysAvailable : [],
        classes: Array.isArray(classes) ? classes : [],
        tutorLeader,
        attendance,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Tutor not found' });
    }

    res.json({ success: true, tutor: updated });
  } catch (error) {
    console.error('Error updating tutor:', error);
    res.status(500).json({ success: false, error: 'Failed to update tutor' });
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

module.exports = route;
