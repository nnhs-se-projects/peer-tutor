/**
 * Works out who a signed-in user is and which role they get.
 * Used at login and to refresh the role stored in the session.
 */

const Tutor = require('../model/tutor');
const Teacher = require('../model/teacher');
const { exactMatch } = require('./regex');
const { DEVELOPER_EMAILS } = require('../middleware/roleAuth');

// Only district Google accounts may sign in
const ALLOWED_EMAIL_DOMAINS = ['naperville203.org', 'stu.naperville203.org'];

// District staff emails that should never be auto-assigned the teacher role
const AUTO_TEACHER_ROLE_EXCLUSIONS = ['skmoore@naperville203.org'];

const emailDomain = email => String(email).toLowerCase().split('@')[1] || '';

const isAllowedEmail = email => ALLOWED_EMAIL_DOMAINS.includes(emailDomain(email));

const isStaffEmail = email =>
  emailDomain(email) === 'naperville203.org' &&
  !AUTO_TEACHER_ROLE_EXCLUSIONS.includes(String(email).toLowerCase());

// Emails are matched case-insensitively because older records were saved as typed
const findTutorByEmail = email => (email ? Tutor.findOne({ email: exactMatch(email) }) : null);

const findTeacherByEmail = email => (email ? Teacher.findOne({ email: exactMatch(email) }) : null);

/**
 * Determine the role and display details for an email address.
 * Inactive tutor records are ignored, so a former tutor signs in like any other student.
 * @param {string} email
 * @returns {Promise<{role: string, userName: string, userId?: *, tutorID?: number}>}
 */
async function resolveUser(email) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const fallbackName = normalizedEmail.split('@')[0];

  const tutor = await findTutorByEmail(normalizedEmail);
  const activeTutor = tutor && tutor.isActive !== false ? tutor : null;
  const tutorDetails = activeTutor
    ? {
        userId: activeTutor._id,
        userName: `${activeTutor.tutorFirstName} ${activeTutor.tutorLastName}`,
        tutorID: activeTutor.tutorID,
      }
    : {};

  if (DEVELOPER_EMAILS.includes(normalizedEmail)) {
    // Keep the developer's tutor record in sync so the admin pages show the right role
    if (activeTutor && activeTutor.role !== 'developer') {
      await Tutor.updateOne({ _id: activeTutor._id }, { role: 'developer' });
    }
    return { role: 'developer', userName: fallbackName, ...tutorDetails };
  }

  if (activeTutor) {
    return { role: activeTutor.role || 'tutor', ...tutorDetails };
  }

  const teacher = await findTeacherByEmail(normalizedEmail);
  if (teacher) {
    return {
      role: teacher.admin ? 'admin' : 'teacher',
      userId: teacher._id,
      userName: `${teacher.teacherFirstName} ${teacher.teacherLastName}`,
    };
  }

  if (isStaffEmail(normalizedEmail)) {
    return { role: 'teacher', userName: fallbackName };
  }

  return { role: 'student', userName: fallbackName };
}

/**
 * Copy the resolved user onto the session, clearing anything left from a previous role.
 */
function applyUserToSession(session, user) {
  session.role = user.role;
  session.userName = user.userName;
  session.userId = user.userId;
  session.tutorID = user.tutorID;
  session.roleCheckedAt = Date.now();
}

module.exports = {
  ALLOWED_EMAIL_DOMAINS,
  isAllowedEmail,
  findTutorByEmail,
  resolveUser,
  applyUserToSession,
};
