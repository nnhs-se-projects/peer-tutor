const express = require('express');
const route = express.Router();
const Entry = require('../model/entry');
const Session = require('../model/session'); // Import the Session schema
const Tutor = require('../model/tutor'); // Import the Tutor schema
const TutoringRequest = require('../model/tutoringRequest'); // Import the TutoringRequest schema
const Teacher = require('../model/teacher'); // Import the Teacher schema
const nodemailer = require('nodemailer');
const { requireRole } = require('../middleware/roleAuth'); // Import role middleware

// assigning variable to the JSON file
const gradeSelection = require('../model/grades.json');

const newReturningOptions = require('../model/newReturningOptions.json');
const lunchPeriods = require('../model/lunchPeriods.json');
const daysOfTheWeek = require('../model/daysOfTheWeek.json');

// assigning variables to the JSON files
const courseList = require('../model/courseList.json');
const courses = require('../model/courses.json');

// Route to render the authentication page

// No additional logic needed here; the handler ends after sending the response.
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
    });
  } catch (error) {
    console.error('Error rendering homepage:', error);
    res.status(500).send('Error loading the homepage. Please try again later.');
  }
});

// route to render classes, grades (tutor resources)
route.get('/tutHome', requireRole('tutor'), (req, res) => {
  res.render('tutHome');
});

// route to student home page (accessible to all authenticated users)
route.get('/stuHome', requireRole('student'), async (req, res) => {
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
route.get('/leadHome', requireRole('lead'), async (req, res) => {
  res.render('leadHome');
});

// route to teacher home page
route.get('/teachHome', requireRole('teacher'), async (req, res) => {
  res.render('teachHome');
});

// route to admin home page
route.get('/adminHome', requireRole('admin'), async (req, res) => {
  res.render('adminHome');
});

// route to a simple notification test page (lead and above)
route.get('/notifications', requireRole('lead'), (req, res) => {
  res.render('notifications', {
    userEmail: req.session.email || '',
  });
});

// route to expertise form page (tutor and above)
route.get('/expertiseForm', requireRole('tutor'), async (req, res) => {
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

// Route to render the tutor attendance (tutor and above)
route.get('/tutorAttendance', requireRole('tutor'), async (req, res) => {
  res.render('tutorAttendance');
});

// Route to render the tutor form (tutor and above)
route.get('/tutorForm', requireRole('tutor'), async (req, res) => {
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

// Route to view tutor database (teacher and above)
route.get('/tutorTable', requireRole('teacher'), async (req, res) => {
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

// Route to view session database (teacher and above)
route.get('/sessionTable', requireRole('teacher'), async (req, res) => {
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

// Route to render the attendance (lead and above)
route.get('/attendance', requireRole('lead'), async (req, res) => {
  try {
    const tutors = await Tutor.find().sort({ date: -1 });

    // Determine the current day of the week (in Central Time)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const todayName = dayNames[now.getDay()];

    // Only include tutors who are available on today's day of the week
    const filteredTutors = tutors.filter(tutor => {
      const days = Array.isArray(tutor.daysAvailable) ? tutor.daysAvailable : [];
      return days.includes(todayName);
    });

    // Convert MongoDB objects to objects formatted for the EJS template
    const tutorsFormatted = filteredTutors.map(tutor => {
      return {
        _id: tutor._id,
        tutorFirstName: tutor.tutorFirstName,
        tutorLastName: tutor.tutorLastName,
        tutorID: tutor.tutorID,
        email: tutor.email,
        date: tutor.date,
        attendance: tutor.attendance,
        daysAvailable: Array.isArray(tutor.daysAvailable) ? tutor.daysAvailable : [],
        lunchPeriod: tutor.lunchPeriod,
      };
    });

    res.render('attendance', { tutors: tutorsFormatted, currentDay: todayName });
  } catch (error) {
    console.error('Error fetching tutors:', error);
    res.status(500).send('Error fetching tutors');
  }
});

route.post('/updateAttendance/:id', async (req, res) => {
  try {
    const tutorId = req.params.id;
    const { change } = req.body;

    // Find the tutor by ID
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    // Update attendance (positive = absences, negative = makeups)
    tutor.attendance += change;

    // Ensure attendance doesn't go below 0
    if (tutor.attendance < 0) tutor.attendance = 0;

    await tutor.save();

    res.json({ attendance: tutor.attendance });
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

route.get('/adminAttendance', requireRole('admin'), (req, res) => {
  res.render('adminAttendance');
});

// Route to render admin tutor requests page
route.get('/admin/tutorRequests', requireRole('admin'), async (req, res) => {
  try {
    const requests = await TutoringRequest.find().sort({ createdAt: -1 });

    // Format the preferred date for display
    const requestsFormatted = requests.map(r => {
      const obj = r.toObject();
      if (obj.preferredDate) {
        const date = new Date(obj.preferredDate);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        obj.preferredDateFormatted =
          days[date.getUTCDay()] +
          ', ' +
          (date.getUTCMonth() + 1) +
          '/' +
          date.getUTCDate() +
          '/' +
          date.getUTCFullYear();
      } else {
        obj.preferredDateFormatted = 'N/A';
      }
      return obj;
    });

    res.render('adminTutorRequests', {
      requests: requestsFormatted,
      user: req.session,
    });
  } catch (error) {
    console.error('Error loading admin tutor requests:', error);
    res.status(500).send('Error loading tutor requests page');
  }
});

// Route to render admin user management page (admin and above)
route.get('/admin/users', requireRole('admin'), async (req, res) => {
  try {
    const tutors = await Tutor.find().sort({ tutorLastName: 1, tutorFirstName: 1 });
    const teachers = await Teacher.find().sort({ teacherLastName: 1, teacherFirstName: 1 });

    res.render('adminUsers', {
      tutors,
      teachers,
      user: req.session,
    });
  } catch (error) {
    console.error('Error loading admin users page:', error);
    res.status(500).send('Error loading user management page');
  }
});

// API endpoint to update a user's role (admin and above)
route.post('/api/admin/users/:id/role', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['student', 'tutor', 'lead', 'teacher', 'admin', 'developer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    // Only developers can assign the developer role
    if (role === 'developer' && req.session.role !== 'developer') {
      return res
        .status(403)
        .json({ success: false, error: 'Only developers can assign the developer role' });
    }

    const tutor = await Tutor.findByIdAndUpdate(id, { role }, { new: true });
    if (!tutor) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, role: tutor.role });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, error: 'Failed to update role' });
  }
});

// ==================== ABSENCE NOTIFICATION API ENDPOINTS ====================

// API endpoint to get tutors with absences above a threshold
route.get('/api/tutors/absences', async (req, res) => {
  try {
    const minAbsences = parseInt(req.query.min) || 1;

    // attendance field stores positive absence count
    const tutors = await Tutor.find({ attendance: { $gte: minAbsences } }).sort({ attendance: -1 });

    const results = tutors.map(tutor => ({
      name: `${tutor.tutorFirstName || 'Unknown'} ${tutor.tutorLastName || 'Tutor'}`.trim(),
      email: tutor.email,
      absenceCount: tutor.attendance || 0,
    }));

    res.json({ success: true, tutors: results });
  } catch (error) {
    console.error('Error fetching tutors with absences:', error);
    res.status(500).json({ success: false, error: 'Failed to load absent tutors' });
  }
});

// API endpoint to send absence notification email(s)
route.post('/api/notifications/absence', async (req, res) => {
  const { date, tutors: tutorList } = req.body;

  if (!tutorList || !Array.isArray(tutorList) || tutorList.length === 0) {
    return res.status(400).json({ success: false, error: 'No tutors provided' });
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
    auth: { user: senderEmail, pass: senderPassword },
  });

  const sent = [];
  const failed = [];

  for (const tutor of tutorList) {
    try {
      const subject = `Peer Tutoring – Absence Notice (${tutor.absenceCount} missed session${tutor.absenceCount !== 1 ? 's' : ''})`;
      const message = [
        `Hi ${tutor.name},`,
        '',
        `Our records show you have ${tutor.absenceCount} unexcused absence${tutor.absenceCount !== 1 ? 's' : ''} as of ${date || new Date().toLocaleDateString()}.`,
        '',
        'Please reach out to your tutor lead or program coordinator if you believe this is an error, or to arrange a makeup session.',
        '',
        'Thank you,',
        'Peer Tutoring Program',
      ].join('\n');

      await transporter.sendMail({
        from: senderEmail,
        to: tutor.email,
        subject,
        text: message,
      });

      sent.push({ email: tutor.email, name: tutor.name });
    } catch (err) {
      console.error(`Failed to email ${tutor.email}:`, err.message);
      failed.push({ email: tutor.email, name: tutor.name, reason: err.message });
    }
  }

  res.json({ success: true, results: { sent, failed } });
});

// API endpoint to send bulk absence notifications based on threshold
route.post('/api/notifications/absence/bulk', async (req, res) => {
  try {
    const minAbsences = parseInt(req.body.minAbsences) || 1;

    const tutors = await Tutor.find({ attendance: { $gte: minAbsences } });

    if (tutors.length === 0) {
      return res.json({ success: true, message: 'No tutors found above the absence threshold.' });
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
      auth: { user: senderEmail, pass: senderPassword },
    });

    const dateStr = new Date().toLocaleDateString();
    let sentCount = 0;
    let failedCount = 0;

    for (const tutor of tutors) {
      try {
        const name = `${tutor.tutorFirstName} ${tutor.tutorLastName}`.trim();
        const absences = tutor.attendance || 0;
        const subject = `Peer Tutoring – Absence Notice (${absences} missed session${absences !== 1 ? 's' : ''})`;
        const message = [
          `Hi ${name},`,
          '',
          `Our records show you have ${absences} unexcused absence${absences !== 1 ? 's' : ''} as of ${dateStr}.`,
          '',
          'Please reach out to your tutor lead or program coordinator if you believe this is an error, or to arrange a makeup session.',
          '',
          'Thank you,',
          'Peer Tutoring Program',
        ].join('\n');

        await transporter.sendMail({
          from: senderEmail,
          to: tutor.email,
          subject,
          text: message,
        });

        sentCount++;
      } catch (err) {
        console.error(`Failed to email ${tutor.email}:`, err.message);
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Sent ${sentCount} notification(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}.`,
    });
  } catch (error) {
    console.error('Error sending bulk absence notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to send bulk notifications' });
  }
});

module.exports = route;

