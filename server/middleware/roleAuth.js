/**
 * Role-based authentication middleware
 * Checks if the user has the required role to access a route
 */

// These users always sign in with the developer role
const DEVELOPER_EMAILS = ['eqin@stu.naperville203.org'];

// Super developers can also change the roles of other developers
const SUPER_DEVELOPER_EMAILS = ['eqin@stu.naperville203.org', 'jxwu@stu.naperville203.org'];

/**
 * Check if an email belongs to a super developer
 * @param {string} email
 * @returns {boolean}
 */
const isSuperDeveloper = email => SUPER_DEVELOPER_EMAILS.includes((email || '').toLowerCase());

// Define role hierarchy - higher roles inherit permissions from lower roles
const ROLE_HIERARCHY = {
  developer: ['developer', 'admin', 'teacher', 'lead', 'tutor', 'student'],
  admin: ['admin', 'teacher', 'lead', 'tutor', 'student'],
  teacher: ['teacher', 'student'],
  lead: ['lead', 'tutor', 'student'],
  tutor: ['tutor', 'student'],
  student: ['student'],
};

/**
 * Get all permissions for a role based on hierarchy
 * @param {string} role - The user's role
 * @returns {string[]} Array of all roles the user has access to
 */
const getRolePermissions = role => ROLE_HIERARCHY[role] || [role];

/**
 * API calls and form submissions get JSON errors; page loads get a redirect or error page.
 * @param {import('express').Request} req
 */
const wantsJson = req => req.method !== 'GET' || req.originalUrl.startsWith('/api/');

const denyAccess = (req, res, message) => {
  if (wantsJson(req)) {
    return res.status(403).json({ success: false, error: message });
  }
  return res.status(403).render('error', { message });
};

/**
 * Middleware to check if user has required role
 * @param  {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.session.email) {
      if (wantsJson(req)) {
        return res.status(401).json({ success: false, error: 'Please sign in again.' });
      }
      return res.redirect('/auth');
    }

    // Check if user has a role assigned
    if (!req.session.role) {
      return denyAccess(
        req,
        res,
        'Access denied. You do not have a role assigned. Please contact an administrator.'
      );
    }

    // Check if any of the allowed roles match the user's effective roles
    const userRoles = getRolePermissions(req.session.role);
    if (!allowedRoles.some(role => userRoles.includes(role))) {
      return denyAccess(req, res, 'Access denied. You do not have permission to do that.');
    }

    next();
  };
};

module.exports = {
  requireRole,
  getRolePermissions,
  isSuperDeveloper,
  wantsJson,
  ROLE_HIERARCHY,
  DEVELOPER_EMAILS,
  SUPER_DEVELOPER_EMAILS,
};
