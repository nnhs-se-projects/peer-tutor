/**
 * Date helpers shared by the routes.
 *
 * Forms send calendar dates as "YYYY-MM-DD". Storing those as midnight UTC makes them
 * show up as the previous day in Central time, so date-only values are stored at noon UTC
 * and always formatted in UTC.
 */

const SCHOOL_TIME_ZONE = 'America/Chicago';

// Attendance records are stored at midnight Central Standard Time (UTC-6) of their day.
// The fixed offset is kept so lookups keep matching the records already in the database.
const ATTENDANCE_UTC_OFFSET = '-06:00';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a "YYYY-MM-DD" string into a Date at noon UTC.
 * @returns {Date|null} null when the value is not a real calendar date
 */
function parseDateOnly(value) {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) return null;

  const date = new Date(`${value}T12:00:00Z`);
  // Rejects dates that roll over, such as 2026-02-30
  if (Number.isNaN(date.getTime()) || !date.toISOString().startsWith(value)) return null;
  return date;
}

/**
 * Start and end of a school day, matching how attendance records are stored.
 * @returns {{start: Date, end: Date}|null}
 */
function getAttendanceDayRange(value) {
  if (!parseDateOnly(value)) return null;
  return {
    start: new Date(`${value}T00:00:00${ATTENDANCE_UTC_OFFSET}`),
    end: new Date(`${value}T23:59:59.999${ATTENDANCE_UTC_OFFSET}`),
  };
}

// Today's date in Central time as "YYYY-MM-DD"
const todayInSchoolZone = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: SCHOOL_TIME_ZONE }).format(new Date());

// Name of the current weekday in Central time, e.g. "Monday"
const weekdayInSchoolZone = () =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: SCHOOL_TIME_ZONE }).format(
    new Date()
  );

/**
 * Format a stored date-only value (session date, preferred date, ...) without shifting it.
 * @param {Date|string|null} value
 * @param {Intl.DateTimeFormatOptions} [options]
 */
function formatDateOnly(value, options = {}) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { timeZone: 'UTC', ...options });
}

module.exports = {
  SCHOOL_TIME_ZONE,
  parseDateOnly,
  getAttendanceDayRange,
  todayInSchoolZone,
  weekdayInSchoolZone,
  formatDateOnly,
};
