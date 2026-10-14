/**
 * Attendance statuses and how much each one counts toward a tutor's days missed.
 * Shared by the attendance routes and the maintenance scripts so they never disagree.
 */

const ATTENDANCE_STATUSES = ['present', 'tardy', 'absent', 'makeup'];

const STATUS_WEIGHTS = {
  present: 0,
  tardy: 0.5,
  absent: 1,
  makeup: -1,
};

const statusWeight = status => STATUS_WEIGHTS[status] || 0;

module.exports = { ATTENDANCE_STATUSES, statusWeight };
