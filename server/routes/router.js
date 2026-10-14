/* eslint-disable no-console */
/**
 * Page routes and JSON API routes.
 * Authentication lives in auth.js and attendance in attendance.js.
 */

const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const Session = require('../model/session');
const Tutor = require('../model/tutor');
const TutoringRequest = require('../model/tutoringRequest');
const Teacher = require('../model/teacher');
const { requireRole, getRolePermissions, isSuperDeveloper } = require('../middleware/roleAuth');
const asyncRoute = require('../middleware/asyncRoute');
const { exactMatch } = require('../utils/regex');
const { findTutorByEmail, isAllowedEmail } = require('../utils/users');
const { parseDateOnly, todayInSchoolZone, formatDateOnly } = require('../utils/dates');
const {
  sendEmail,
  isEmailConfigured,
  getEmailConfigErrorMessage,
  sendRequestAcceptedEmail,
  sendRequestDeclinedEmail,
  sendAbsenceNotice,
} = require('../utils/emailService');

// Options for the form dropdowns
const gradeSelection = require('../model/grades.json');
const newReturningOptions = require('../model/newReturningOptions.json');
const lunchPeriods = require('../model/lunchPeriods.json');
const daysOfTheWeek = require('../model/daysOfTheWeek.json');

// Subjects with their classes and teachers. This is the only class list, so student
// requests, tutor expertise, and session logs always use the same class names.
const courses = require('../model/courses.json');
const allClasses = [...new Set(Object.values(courses).flatMap(subject => subject.classes))].sort(
  (a, b) => a.localeCompare(b)
);

const TUTOR_ROLES = Tutor.schema.path('role').enumValues;
const NO_TUTOR_ACCOUNT = 'Tutor account not found for the current login';

const isObjectId = value => mongoose.isObjectIdOrHexString(value);

// Trimmed text from a request body, or '' when it is missing or not a string
const cleanText = (value, maxLength = 200) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const fullName = tutor =>
  `${tutor.tutorFirstName || 'Unknown'} ${tutor.tutorLastName || 'Tutor'}`.trim();

const getTutorFromSession = req => findTutorByEmail(req.session.email);

const isAdmin = req => getRolePermissions(req.session.role).includes('admin');

// Regular expressions matching each class in a tutor's expertise list
const tutorClassMatchers = tutor =>
  (Array.isArray(tutor.classes) ? tutor.classes : [])
    .map(className => String(className).trim())
    .filter(Boolean)
    .map(exactMatch);

// Shape a session for display, falling back to the field names older records used
function formatSession(session) {
  const legacyName = (last, first) => (last && first ? `${last}, ${first}` : '');
  return {
    date: formatDateOnly(session.sessionDate),
    dateISO: session.sessionDate ? new Date(session.sessionDate).toISOString() : '',
    tuteeName: session.tuteeName || legacyName(session.tuteeLastName, session.tuteeFirstName),
    tutorName: session.tutorName || legacyName(session.tutorLastName, session.tutorFirstName),
    sessionPeriod: session.sessionPeriod || '',
    teacher: session.teacher || 'Not Specified',
    department: session.department || session.subject || '',
    class: session.class || '',
    focusOfSession: session.focusOfSession || '',
    workAccomplished: session.workAccomplished || '',
    isMakeup: Boolean(session.isMakeup),
  };
}

// ==================== PAGES ====================

// Leaderboard
route.get(
  '/',
  asyncRoute(async (req, res) => {
    const tutors = await Tutor.find().select(
      'tutorFirstName tutorLastName sessionHistory pastSessionCount'
    );

    const rankedTutors = tutors
      .map(tutor => ({
        firstName: tutor.tutorFirstName || 'Unknown',
        lastName: tutor.tutorLastName || 'Tutor',
        totalSessions: tutor.totalSessions,
      }))
      .sort((a, b) => b.totalSessions - a.totalSessions);

    res.render('homepage', {
      tutors: rankedTutors.slice(0, 15),
      top3: rankedTutors.slice(0, 3),
      currentPage: 'homepage',
    });
  })
);

route.get('/stuHome', requireRole('student'), (req, res) => {
  res.render('stuHome', { currentPage: 'stuHome' });
});

route.get('/tutHome', requireRole('tutor'), (req, res) => {
  res.render('tutHome', { currentPage: 'tutHome' });
});

route.get('/leadHome', requireRole('lead'), (req, res) => {
  res.render('leadHome', { currentPage: 'leadHome' });
});

route.get('/teachHome', requireRole('teacher'), (req, res) => {
  res.render('teachHome', { currentPage: 'teachHome' });
});

route.get('/adminHome', requireRole('admin'), (req, res) => {
  res.render('adminHome', { currentPage: 'adminHome' });
});

route.get('/notifications', requireRole('lead'), (req, res) => {
  res.render('notifications', { currentPage: 'notifications' });
});

route.get(
  '/expertiseForm',
  requireRole('tutor'),
  asyncRoute(async (req, res) => {
    // Admins open the form with ?mode=add to add someone else as a tutor.
    // Everyone else edits their own record, which is used to fill in the form.
    const addingTutor = req.query.mode === 'add' && isAdmin(req);
    const tutor = addingTutor ? null : await getTutorFromSession(req);

    res.render('expertiseForm', {
      grades: gradeSelection,
      options: newReturningOptions,
      lunchPeriods,
      daysOfTheWeek,
      courseList: allClasses,
      tutor,
      addingTutor,
      sessionEmail: req.session.email,
      currentPage: 'expertiseForm',
    });
  })
);

route.get('/tutorAttendance', requireRole('tutor'), (req, res) => {
  res.render('tutorAttendance', { currentPage: 'tutorAttendance' });
});

route.get(
  '/tutorForm',
  requireRole('tutor'),
  asyncRoute(async (req, res) => {
    const tutor = await getTutorFromSession(req);
    const requests = tutor
      ? await TutoringRequest.find({ tutorId: tutor._id, status: 'accepted' }).sort({
          preferredDate: 1,
        })
      : [];

    const acceptedRequests = requests.map(request => ({
      ...request.toObject(),
      preferredDateValue: request.preferredDate
        ? request.preferredDate.toISOString().slice(0, 10)
        : '',
      preferredDateLabel: formatDateOnly(request.preferredDate) || 'No date',
    }));

    res.render('tutorForm', { tutor, acceptedRequests, currentPage: 'tutorForm' });
  })
);

route.get(
  '/tutorTable',
  requireRole('teacher'),
  asyncRoute(async (req, res) => {
    const tutors = await Tutor.find().sort({ tutorLastName: 1, tutorFirstName: 1 });

    const tutorsFormatted = tutors.map(tutor => ({
      id: tutor._id.toString(),
      tutorName: fullName(tutor),
      email: tutor.email,
      grade: tutor.grade,
      tutorID: tutor.tutorID,
      classes: Array.isArray(tutor.classes) ? tutor.classes : [],
      daysAvailable: Array.isArray(tutor.daysAvailable) ? tutor.daysAvailable : [],
      lunchPeriod: tutor.lunchPeriod,
      totalSessions: tutor.totalSessions,
      absences: tutor.attendance || 0,
    }));

    res.render('tutorTable', { tutors: tutorsFormatted, currentPage: 'tutorTable' });
  })
);

route.get(
  '/sessionTable',
  requireRole('teacher'),
  asyncRoute(async (req, res) => {
    const sessions = await Session.find().sort({ sessionDate: -1 });
    res.render('sessionTable', { sessions: sessions.map(formatSession), currentPage: 'sessionTable' });
  })
);

route.get('/adminAttendance', requireRole('admin'), (req, res) => {
  res.render('adminAttendance', { currentPage: 'adminAttendance' });
});

route.get(
  '/admin/tutorRequests',
  requireRole('admin'),
  asyncRoute(async (req, res) => {
    const requests = await TutoringRequest.find().sort({ createdAt: -1 });

    const requestsFormatted = requests.map(request => ({
      ...request.toObject(),
      // e.g. "Monday, 2/23/2026"
      preferredDateFormatted:
        formatDateOnly(request.preferredDate, {
          weekday: 'long',
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
        }) || 'N/A',
    }));

    res.render('adminTutorRequests', {
      requests: requestsFormatted,
      currentPage: 'adminTutorRequests',
    });
  })
);

route.get(
  '/admin/users',
  requireRole('admin'),
  asyncRoute(async (req, res) => {
    const [tutors, teachers] = await Promise.all([
      Tutor.find().sort({ tutorLastName: 1, tutorFirstName: 1 }),
      Teacher.find().sort({ teacherLastName: 1, teacherFirstName: 1 }),
    ]);

    res.render('adminUsers', {
      tutors,
      teachers,
      currentPage: 'adminUsers',
      isSuperDeveloper: isSuperDeveloper(req.session.email),
    });
  })
);

// ==================== FORM SUBMISSIONS ====================

// Log a tutoring session for the signed-in tutor
route.post(
  '/submitTutorForm',
  requireRole('tutor'),
  asyncRoute(async (req, res) => {
    const tutor = await getTutorFromSession(req);
    if (!tutor) {
      return res.status(403).json({ success: false, error: NO_TUTOR_ACCOUNT });
    }

    const sessionDate = parseDateOnly(req.body.sessionDate);
    const fields = {
      tuteeName: cleanText(req.body.tuteeName, 100),
      sessionPeriod: cleanText(req.body.sessionPeriod, 20),
      teacher: cleanText(req.body.teacher, 100),
      department: cleanText(req.body.department, 100),
      class: cleanText(req.body.class),
      focusOfSession: cleanText(req.body.focusOfSession, 100),
      workAccomplished: cleanText(req.body.workAccomplished, 1000),
    };

    if (!sessionDate || Object.values(fields).some(value => !value)) {
      return res
        .status(400)
        .json({ success: false, error: 'Please fill in all required fields.' });
    }

    // A linked request has to be one this tutor accepted
    let linkedRequest = null;
    if (req.body.tutoringRequestId) {
      if (isObjectId(req.body.tutoringRequestId)) {
        linkedRequest = await TutoringRequest.findOne({
          _id: req.body.tutoringRequestId,
          tutorId: tutor._id,
          status: 'accepted',
        });
      }
      if (!linkedRequest) {
        return res.status(400).json({
          success: false,
          error: 'The selected request is not one of your accepted requests.',
        });
      }
    }

    const session = await Session.create({
      ...fields,
      sessionDate,
      tutorName: `${tutor.tutorLastName}, ${tutor.tutorFirstName}`,
      tutorId: tutor._id,
      isMakeup: req.body.isMakeup === true,
    });

    await Tutor.updateOne({ _id: tutor._id }, { $push: { sessionHistory: session._id } });

    if (linkedRequest) {
      await TutoringRequest.updateOne({ _id: linkedRequest._id }, { status: 'completed' });
    }

    res.json({ success: true });
  })
);

// Save a tutor's expertise and availability. Tutors can only save their own record;
// admins can also add or update any tutor (the "Add Tutor" button on the tutor table).
route.post(
  '/submitExpertiseForm',
  requireRole('tutor'),
  asyncRoute(async (req, res) => {
    const { body } = req;
    const details = {
      tutorFirstName: cleanText(body.tutorFirstName, 100),
      tutorLastName: cleanText(body.tutorLastName, 100),
      grade: Number(body.grade),
      returning: body.returning === true,
      lunchPeriod: Number(body.lunchPeriod),
      daysAvailable: Array.isArray(body.daysAvailable)
        ? body.daysAvailable.filter(day => daysOfTheWeek.includes(day))
        : [],
      classes: Array.isArray(body.classes)
        ? [...new Set(body.classes.filter(className => allClasses.includes(className)))]
        : [],
    };

    if (
      !details.tutorFirstName ||
      !details.tutorLastName ||
      !gradeSelection.includes(String(body.grade)) ||
      !lunchPeriods.includes(String(body.lunchPeriod)) ||
      typeof body.returning !== 'boolean'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in your name, grade, new/returning status, and lunch period.',
      });
    }

    const tutorID = Number(body.tutorID);
    const validTutorID = Number.isInteger(tutorID) && tutorID > 0;
    const newTutorDefaults = { tutorLeader: false, attendance: 0, sessionHistory: [] };

    if (body.addingTutor) {
      if (!isAdmin(req)) {
        return res
          .status(403)
          .json({ success: false, error: 'Only admins can add other tutors.' });
      }

      const email = cleanText(body.email).toLowerCase();
      if (!isAllowedEmail(email) || !validTutorID) {
        return res.status(400).json({
          success: false,
          error: "Please enter the tutor's ID number and district email address.",
        });
      }

      const [tutorWithId, tutorWithEmail] = await Promise.all([
        Tutor.findOne({ tutorID }),
        findTutorByEmail(email),
      ]);
      if (tutorWithEmail && !(tutorWithId && tutorWithEmail._id.equals(tutorWithId._id))) {
        return res
          .status(409)
          .json({ success: false, error: 'A different tutor already uses that email.' });
      }

      // An existing ID updates that tutor instead of creating a duplicate
      if (tutorWithId) {
        tutorWithId.set({ ...details, email });
        await tutorWithId.save();
        return res.json({ success: true, updated: true });
      }

      await Tutor.create({ ...details, ...newTutorDefaults, tutorID, email, role: 'tutor' });
      return res.json({ success: true, created: true });
    }

    // Tutors editing their own record can't change their email, ID, absences, or role
    const tutor = await getTutorFromSession(req);
    if (tutor) {
      tutor.set(details);
      await tutor.save();
      return res.json({ success: true, updated: true });
    }

    // First time filling out the form: create a tutor record for this account
    if (!validTutorID) {
      return res.status(400).json({ success: false, error: 'Please enter your ID number.' });
    }
    if (await Tutor.exists({ tutorID })) {
      return res.status(409).json({
        success: false,
        error: 'That ID number already belongs to another tutor. Please ask an admin for help.',
      });
    }

    await Tutor.create({
      ...details,
      ...newTutorDefaults,
      tutorID,
      email: req.session.email,
      // Keep the access the account already has (e.g. an admin filling out the form)
      role: TUTOR_ROLES.includes(req.session.role) ? req.session.role : 'tutor',
    });
    res.json({ success: true, created: true });
  })
);

// ==================== STUDENT API ====================

// Subjects, classes, and teachers for the form dropdowns
route.get('/api/courses', (req, res) => {
  res.json(courses);
});

// Tutors who can help with a class (only details students need)
route.get(
  '/api/tutors',
  requireRole('student'),
  asyncRoute(async (req, res) => {
    const className = cleanText(req.query.class);
    if (!className) {
      return res.status(400).json({ success: false, error: 'Class is a required parameter' });
    }

    const tutors = await Tutor.find({ classes: exactMatch(className), isActive: { $ne: false } })
      .select('tutorFirstName tutorLastName grade lunchPeriod daysAvailable')
      .sort({ tutorLastName: 1, tutorFirstName: 1 });

    res.json(
      tutors.map(tutor => ({
        tutorFirstName: tutor.tutorFirstName,
        tutorLastName: tutor.tutorLastName,
        grade: tutor.grade,
        lunchPeriod: tutor.lunchPeriod,
        daysAvailable: tutor.daysAvailable,
      }))
    );
  })
);

// Submit a tutoring request. Every request is posted to the general request board.
route.post(
  '/api/tutoringRequest',
  requireRole('student'),
  asyncRoute(async (req, res) => {
    const { body } = req;
    const subject = cleanText(body.subject);
    const className = cleanText(body.class);
    const topic = cleanText(body.topic);
    const studentFirstName = cleanText(body.studentFirstName, 100);
    const studentLastName = cleanText(body.studentLastName, 100);
    const preferredPeriod = cleanText(body.preferredPeriod, 10);
    const preferredDate = parseDateOnly(body.preferredDate);

    if (
      !subject ||
      !className ||
      !topic ||
      !preferredDate ||
      !preferredPeriod ||
      !studentFirstName ||
      !studentLastName
    ) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (!courses[subject] || !courses[subject].classes.includes(className)) {
      return res
        .status(400)
        .json({ success: false, error: 'Please choose a subject and class from the list.' });
    }

    if (!lunchPeriods.includes(preferredPeriod)) {
      return res.status(400).json({ success: false, error: 'Please choose a lunch period.' });
    }

    if (body.preferredDate < todayInSchoolZone()) {
      return res
        .status(400)
        .json({ success: false, error: 'The preferred date cannot be in the past.' });
    }

    const newRequest = await TutoringRequest.create({
      studentEmail: req.session.email,
      studentFirstName,
      studentLastName,
      studentID: cleanText(body.studentID, 20),
      studentGrade: cleanText(body.studentGrade, 4),
      requestType: 'general',
      subject,
      class: className,
      topic,
      preferredDate,
      preferredPeriod,
      additionalNotes: cleanText(body.additionalNotes, 1000),
      status: 'pending',
    });

    res.json({ success: true, requestId: newRequest._id });
  })
);

// ==================== TUTOR API ====================

// Requests assigned to the signed-in tutor
route.get(
  '/api/tutor/requests',
  requireRole('tutor'),
  asyncRoute(async (req, res) => {
    const tutor = await getTutorFromSession(req);
    if (!tutor) {
      return res.status(403).json({ success: false, error: NO_TUTOR_ACCOUNT });
    }

    const requests = await TutoringRequest.find({
      tutorId: tutor._id,
      status: { $in: ['pending', 'accepted'] },
    }).sort({ createdAt: -1 });

    res.json({ success: true, requests });
  })
);

// Open general requests for classes the tutor can help with
route.get(
  '/api/tutor/general-requests',
  requireRole('tutor'),
  asyncRoute(async (req, res) => {
    const tutor = await getTutorFromSession(req);
    if (!tutor) {
      return res.status(403).json({ success: false, error: NO_TUTOR_ACCOUNT });
    }

    const classMatchers = tutorClassMatchers(tutor);
    if (!classMatchers.length) {
      return res.json({ success: true, requests: [] });
    }

    const requests = await TutoringRequest.find({
      requestType: 'general',
      status: 'pending',
      class: { $in: classMatchers },
      // Requests for days that have already passed drop off the board
      preferredDate: { $gte: parseDateOnly(todayInSchoolZone()) },
    })
      .select(
        'subject class topic preferredDate preferredPeriod additionalNotes studentFirstName studentLastName createdAt'
      )
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  })
);

// Claim a general tutoring request
route.post(
  '/api/tutor/general-requests/:requestId/take',
  requireRole('tutor'),
  asyncRoute(async (req, res) => {
    const { requestId } = req.params;
    if (!isObjectId(requestId)) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const tutor = await getTutorFromSession(req);
    if (!tutor) {
      return res.status(403).json({ success: false, error: NO_TUTOR_ACCOUNT });
    }

    // Claim in a single update so two tutors can't take the same request
    const request = await TutoringRequest.findOneAndUpdate(
      {
        _id: requestId,
        requestType: 'general',
        status: 'pending',
        class: { $in: tutorClassMatchers(tutor) },
      },
      {
        $set: {
          tutorId: tutor._id,
          tutorName: fullName(tutor),
          tutorEmail: tutor.email,
          status: 'accepted',
          responseMessage:
            cleanText(req.body.responseMessage, 500) || 'Accepted from the general request board.',
          respondedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!request) {
      const existing = await TutoringRequest.findById(requestId);
      if (!existing || existing.requestType !== 'general') {
        return res.status(404).json({ success: false, error: 'Request not found' });
      }
      if (existing.status !== 'pending') {
        return res
          .status(409)
          .json({ success: false, error: 'This request is no longer available' });
      }
      return res.status(403).json({
        success: false,
        error: 'You can only claim requests for classes in your expertise list',
      });
    }

    await sendRequestAcceptedEmail(request);
    res.json({ success: true, request });
  })
);

// Accept or decline a request that was sent to the signed-in tutor
route.post(
  '/api/tutor/requests/:requestId/respond',
  requireRole('tutor'),
  asyncRoute(async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "accepted" or "declined"',
      });
    }
    if (!isObjectId(requestId)) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const tutor = await getTutorFromSession(req);
    if (!tutor) {
      return res.status(403).json({ success: false, error: NO_TUTOR_ACCOUNT });
    }

    // Only the tutor the request was sent to can answer it, and only once
    const request = await TutoringRequest.findOneAndUpdate(
      { _id: requestId, tutorId: tutor._id, status: 'pending' },
      {
        $set: {
          status,
          responseMessage: cleanText(req.body.responseMessage, 500),
          respondedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!request) {
      return res
        .status(404)
        .json({ success: false, error: 'Request not found or already answered' });
    }

    if (status === 'accepted') {
      await sendRequestAcceptedEmail(request);
    } else {
      await sendRequestDeclinedEmail(request);
    }

    res.json({ success: true, request });
  })
);

// Attendance summary and session history for a tutor
route.get(
  '/api/tutor-attendance/:id',
  requireRole('tutor'),
  asyncRoute(async (req, res) => {
    const tutorID = Number(req.params.id);
    const tutor = Number.isInteger(tutorID) ? await Tutor.findOne({ tutorID }) : null;
    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    // Tutors can only look up their own record; leads and admins can look up anyone
    const canViewOthers = getRolePermissions(req.session.role).includes('lead');
    if (!canViewOthers && (tutor.email || '').toLowerCase() !== req.session.email) {
      return res.status(403).json({ error: 'You can only view your own attendance.' });
    }

    // Count before populating, since populate leaves out sessions that no longer exist
    const sessionCount = tutor.totalSessions;
    await tutor.populate('sessionHistory');

    res.json({
      name: fullName(tutor),
      daysMissed: tutor.attendance || 0,
      sessionCount,
      sessions: tutor.sessionHistory.map(session => {
        const formatted = formatSession(session);
        return {
          date: formatted.date,
          department: formatted.department,
          student: formatted.tuteeName,
          period: formatted.sessionPeriod,
        };
      }),
    });
  })
);

// ==================== ADMIN API ====================

// Most recent sessions for the admin home page
route.get(
  '/api/sessions/recent',
  requireRole('admin'),
  asyncRoute(async (req, res) => {
    const sessions = await Session.find().sort({ sessionDate: -1 }).limit(10);
    res.json(sessions.map(formatSession));
  })
);

route.post(
  '/api/tutors/delete',
  requireRole('admin'),
  asyncRoute(async (req, res) => {
    const { id } = req.body;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Missing tutor id' });
    }

    const deleted = await Tutor.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Tutor not found' });
    }

    res.json({ success: true });
  })
);

route.post(
  '/api/admin/users/:id/role',
  requireRole('admin'),
  asyncRoute(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!TUTOR_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    // Only developers can assign the developer role
    if (role === 'developer' && req.session.role !== 'developer') {
      return res
        .status(403)
        .json({ success: false, error: 'Only developers can assign the developer role' });
    }

    const targetTutor = isObjectId(id) ? await Tutor.findById(id) : null;
    if (!targetTutor) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Only super developers can change the role of another developer
    if (targetTutor.role === 'developer' && !isSuperDeveloper(req.session.email)) {
      return res
        .status(403)
        .json({ success: false, error: "Only super developers can change a developer's role" });
    }

    await Tutor.updateOne({ _id: id }, { role });
    res.json({ success: true, role });
  })
);

// ==================== NOTIFICATION API (leads and above) ====================

// Tutor names and emails for the notification recipient list
route.get(
  '/api/tutor-emails',
  requireRole('lead'),
  asyncRoute(async (req, res) => {
    const tutors = await Tutor.find({ email: { $exists: true, $ne: '' } })
      .select('tutorFirstName tutorLastName email lunchPeriod classes')
      .sort({ tutorLastName: 1, tutorFirstName: 1 });

    const results = tutors.map(tutor => ({
      name: fullName(tutor),
      email: tutor.email,
      lunchPeriod: tutor.lunchPeriod,
      classes: Array.isArray(tutor.classes) ? tutor.classes : [],
    }));

    res.json({ success: true, tutors: results });
  })
);

// Send an email to one or more tutors
route.post(
  '/api/notifications/send',
  requireRole('lead'),
  asyncRoute(async (req, res) => {
    const { to } = req.body;
    const subject = cleanText(req.body.subject);
    const message = cleanText(req.body.message, 10000);
    const recipients = [
      ...new Set(
        (Array.isArray(to) ? to : [to])
          .filter(address => typeof address === 'string')
          .map(address => address.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];

    if (!recipients.length || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing recipients, subject, or message' });
    }

    if (!isEmailConfigured()) {
      return res.status(500).json({ success: false, error: getEmailConfigErrorMessage() });
    }

    // Only tutors can be emailed from here
    const tutors = await Tutor.find({ email: { $in: recipients.map(exactMatch) } }).select('email');
    const tutorEmails = new Set(tutors.map(tutor => tutor.email.toLowerCase()));
    if (recipients.some(address => !tutorEmails.has(address))) {
      return res
        .status(400)
        .json({ success: false, error: 'Notifications can only be sent to tutors' });
    }

    // Bcc so tutors don't see each other's addresses
    await sendEmail({ bcc: recipients, subject, text: message });
    res.json({ success: true });
  })
);

// Minimum days missed from a query or body value, defaulting to 1
const absenceThreshold = value => {
  const parsed = parseFloat(value);
  return parsed > 0 ? parsed : 1;
};

// Email each tutor their absence count and report who was reached
async function sendAbsenceNotices(tutors) {
  const sent = [];
  const failed = [];

  for (const tutor of tutors) {
    const name = fullName(tutor);
    try {
      await sendAbsenceNotice({ email: tutor.email, name, absenceCount: tutor.attendance || 0 });
      sent.push({ email: tutor.email, name });
    } catch (err) {
      console.error(`Failed to send absence notice to ${name}:`, err.message);
      failed.push({ email: tutor.email, name, reason: err.message });
    }
  }

  return { sent, failed };
}

// Tutors with at least the given number of days missed
route.get(
  '/api/tutors/absences',
  requireRole('lead'),
  asyncRoute(async (req, res) => {
    const tutors = await Tutor.find({
      attendance: { $gte: absenceThreshold(req.query.min) },
    }).sort({ attendance: -1 });

    const results = tutors.map(tutor => ({
      id: tutor._id,
      name: fullName(tutor),
      email: tutor.email,
      absenceCount: tutor.attendance || 0,
    }));

    res.json({ success: true, tutors: results });
  })
);

// Send absence notices to specific tutors
route.post(
  '/api/notifications/absence',
  requireRole('lead'),
  asyncRoute(async (req, res) => {
    const tutorIds = Array.isArray(req.body.tutorIds) ? req.body.tutorIds.filter(isObjectId) : [];
    if (!tutorIds.length) {
      return res.status(400).json({ success: false, error: 'No tutors provided' });
    }

    if (!isEmailConfigured()) {
      return res.status(500).json({ success: false, error: getEmailConfigErrorMessage() });
    }

    const tutors = await Tutor.find({ _id: { $in: tutorIds } });
    res.json({ success: true, results: await sendAbsenceNotices(tutors) });
  })
);

// Send absence notices to every tutor at or above the threshold
route.post(
  '/api/notifications/absence/bulk',
  requireRole('lead'),
  asyncRoute(async (req, res) => {
    const tutors = await Tutor.find({
      attendance: { $gte: absenceThreshold(req.body.minAbsences) },
    });

    if (tutors.length === 0) {
      return res.json({ success: true, message: 'No tutors found above the absence threshold.' });
    }

    if (!isEmailConfigured()) {
      return res.status(500).json({ success: false, error: getEmailConfigErrorMessage() });
    }

    const { sent, failed } = await sendAbsenceNotices(tutors);
    res.json({
      success: true,
      message: `Sent ${sent.length} notification(s)${failed.length ? `, ${failed.length} failed` : ''}.`,
    });
  })
);

module.exports = route;
