/**
 * Email service utility for sending automated notifications.
 * Uses nodemailer with Gmail SMTP.
 *
 * Required environment variables:
 *   EMAIL_SENDER   – Gmail address used as the "from" field
 *   EMAIL_PASSWORD  – App password for the Gmail account
 */

const nodemailer = require('nodemailer');
const { formatDateOnly, SCHOOL_TIME_ZONE } = require('./dates');

let cachedTransporter = null;

function getEmailCredentials() {
  const senderEmail =
    process.env.EMAIL_SENDER || process.env.EMAIL_USER || process.env.GMAIL_USER || '';
  const senderPassword =
    process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '';

  return { senderEmail, senderPassword };
}

function getEmailConfigErrorMessage() {
  return 'Email credentials not configured. Set EMAIL_SENDER/EMAIL_PASSWORD (or EMAIL_USER/EMAIL_PASS) in .env';
}

function isEmailConfigured() {
  const { senderEmail, senderPassword } = getEmailCredentials();
  return Boolean(senderEmail && senderPassword);
}

/**
 * Create (or reuse) a nodemailer transporter configured from env vars.
 * Returns null when credentials are missing so callers can fail gracefully.
 */
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { senderEmail, senderPassword } = getEmailCredentials();

  if (!senderEmail || !senderPassword) {
    console.error(getEmailConfigErrorMessage());
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: senderPassword,
    },
  });

  return cachedTransporter;
}

/**
 * Send an email from the program account.
 * Use `bcc` for messages to several people so they don't see each other's addresses.
 */
async function sendEmail({ to, bcc, subject, text, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error(getEmailConfigErrorMessage());
  }

  const { senderEmail } = getEmailCredentials();

  return transporter.sendMail({
    from: senderEmail,
    to: to || senderEmail,
    bcc,
    subject,
    text,
    html,
  });
}

/**
 * Format a stored date like "February 26, 2026".
 */
function formatDate(date) {
  return (
    formatDateOnly(date, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) || 'N/A'
  );
}

// Join the lines of a plain-text email, dropping optional lines that were left out
const buildText = lines => lines.filter(line => line !== null).join('\n');

// ─── Tutoring‑request response emails ─────────────────────────────────────────

/**
 * Send an email to the tutee when a tutor ACCEPTS their request.
 *
 * @param {Object} request – The TutoringRequest document (after update)
 */
async function sendRequestAcceptedEmail(request) {
  const transporter = getTransporter();
  if (!transporter) return;

  const to = request.studentEmail;
  const subject = 'Your Tutoring Request Has Been Accepted!';

  const text = buildText([
    `Hi ${request.studentFirstName},`,
    '',
    'Great news — your tutoring request has been accepted! Here are the details:',
    '',
    `  Tutor:   ${request.tutorName}`,
    `  Subject: ${request.subject} – ${request.class}`,
    `  Date:    ${formatDate(request.preferredDate)}`,
    `  Period:  ${request.preferredPeriod}`,
    '',
    request.responseMessage ? `Message from your tutor: "${request.responseMessage}"` : null,
    request.responseMessage ? '' : null,
    'Please make sure to show up on time. Good luck!',
    '',
    '— Peer Tutoring Team',
  ]);

  try {
    await sendEmail({
      to,
      subject,
      text,
    });
    console.info('Acceptance email sent');
  } catch (err) {
    console.error('Failed to send acceptance email:', err.message);
  }
}

/**
 * Send an email to the tutee when a tutor DECLINES their request.
 *
 * @param {Object} request – The TutoringRequest document (after update)
 */
async function sendRequestDeclinedEmail(request) {
  const transporter = getTransporter();
  if (!transporter) return;

  const to = request.studentEmail;
  const subject = 'Update on Your Tutoring Request';

  const text = buildText([
    `Hi ${request.studentFirstName},`,
    '',
    'Unfortunately, your tutoring request has been declined.',
    '',
    request.responseMessage ? `Reason: "${request.responseMessage}"` : null,
    request.responseMessage ? '' : null,
    'You can submit a new request at any time to find another tutor.',
    '',
    '— Peer Tutoring Team',
  ]);

  try {
    await sendEmail({
      to,
      subject,
      text,
    });
    console.info('Declined email sent');
  } catch (err) {
    console.error('Failed to send declined email:', err.message);
  }
}

// ─── Absence notices (sent to tutors) ────────────────────────────────────────

/**
 * Email a tutor about their current number of missed sessions.
 * Throws if the email could not be sent so callers can report failures.
 *
 * @param {{email: string, name: string, absenceCount: number}} tutor
 */
async function sendAbsenceNotice({ email, name, absenceCount }) {
  const plural = absenceCount !== 1 ? 's' : '';
  const asOf = new Date().toLocaleDateString('en-US', { timeZone: SCHOOL_TIME_ZONE });

  await sendEmail({
    to: email,
    subject: `Peer Tutoring – Absence Notice (${absenceCount} missed session${plural})`,
    text: buildText([
      `Hi ${name},`,
      '',
      `Our records show you have ${absenceCount} unexcused absence${plural} as of ${asOf}.`,
      '',
      'Please reach out to your tutor lead or program coordinator if you believe this is an error, or to arrange a makeup session.',
      '',
      'Thank you,',
      'Peer Tutoring Program',
    ]),
  });
}

module.exports = {
  sendEmail,
  isEmailConfigured,
  getEmailConfigErrorMessage,
  sendRequestAcceptedEmail,
  sendRequestDeclinedEmail,
  sendAbsenceNotice,
};
