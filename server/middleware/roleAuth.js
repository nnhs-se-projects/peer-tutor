/**
 * Role-based authentication middleware
 * Checks if the user has the required role to access a route
 */

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
 * Middleware to check if user has required role
 * @param  {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.session.email) {
      return res.redirect('/auth/');
    }

    // Check if user has a role assigned
    if (!req.session.role) {
      return res.status(403).render('error', {
        message: 'Access denied. You do not have a role assigned. Please contact an administrator.',
        user: req.session,
      });
    }

    // Get all roles the user's role has access to
    const userRoles = ROLE_HIERARCHY[req.session.role] || [req.session.role];

    // Check if any of the allowed roles match the user's effective roles
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).render('error', {
        message: 'Access denied. You do not have permission to view this page.',
        user: req.session,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has specific role (exact match, no hierarchy)
 * @param  {...string} allowedRoles - Exact roles that are allowed
 * @returns {Function} Express middleware function
 */
const requireExactRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session.email) {
      return res.redirect('/auth/');
    }

    if (!req.session.role || !allowedRoles.includes(req.session.role)) {
      return res.status(403).render('error', {
        message: 'Access denied. You do not have permission to view this page.',
        user: req.session,
      });
    }

    next();
  };
};

/**
 * Get all permissions for a role based on hierarchy
 * @param {string} role - The user's role
 * @returns {string[]} Array of all roles the user has access to
 */
const getRolePermissions = role => {
  return ROLE_HIERARCHY[role] || [role];
};

module.exports = {
  requireRole,
  requireExactRole,
  getRolePermissions,
  ROLE_HIERARCHY,
};
