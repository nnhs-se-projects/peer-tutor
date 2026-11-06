/**
 * Role-based authentication middleware
 * Checks if the user has the required role to access a route
 */

// These users always sign in with the developer role
const DEVELOPER_EMAILS = ['eqin@stu.naperville203.org', 'gschmit@naperville203.org'];

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

// View As is for roles that oversee other people's pages
const ROLES_WITHOUT_VIEW_AS = ['tutor', 'student'];

/**
 * Get all permissions for a role based on hierarchy
 * @param {string} role - The user's role
 * @returns {string[]} Array of all roles the user has access to
 */
const getRolePermissions = role => ROLE_HIERARCHY[role] || [role];

/**
 * Get the roles a role can use with View As, which are the ones below it in the hierarchy
 * @param {string} role - The user's real role
 * @returns {string[]} Array of roles the user can view the site as
 */
const getViewAsRoles = role =>
  ROLES_WITHOUT_VIEW_AS.includes(role)
    ? []
    : getRolePermissions(role).filter(lower => lower !== role);

/**
 * Get the role a session is acting as. session.role is always the user's real role. The View As
 * role only counts while it's below that, so losing a role can't leave its access behind.
 * @param {Object} session - The Express session
 * @returns {string} The View As role if one is active, otherwise the real role
 */
const getActiveRole = session =>
  getViewAsRoles(session.role).includes(session.viewAsRole) ? session.viewAsRole : session.role;

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
    const userRoles = getRolePermissions(getActiveRole(req.session));
    if (!allowedRoles.some(role => userRoles.includes(role))) {
      // View As is what's in the way when the user's own role would have been allowed
      const realRoles = getRolePermissions(req.session.role);
      const message = allowedRoles.some(role => realRoles.includes(role))
        ? "You can't do that in View As. Use the View As menu to go back to your own role."
        : 'Access denied. You do not have permission to do that.';
      return denyAccess(req, res, message);
    }

    next();
  };
};

module.exports = {
  requireRole,
  getRolePermissions,
  getViewAsRoles,
  getActiveRole,
  isSuperDeveloper,
  wantsJson,
  ROLE_HIERARCHY,
  DEVELOPER_EMAILS,
  SUPER_DEVELOPER_EMAILS,
};
