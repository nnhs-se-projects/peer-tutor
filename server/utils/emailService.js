/**
 * Email service utility for sending automated notifications.
 * Uses nodemailer with Gmail SMTP.
 *
 * Required environment variables:
 *   EMAIL_SENDER   – Gmail address used as the "from" field
 *   EMAIL_PASSWORD  – App password for the Gmail account
 */

const nodemailer = require('nodemailer');

/**
 * Create (or reuse) a nodemailer transporter configured from env vars.
 * Returns null when credentials are missing so callers can fail gracefully.
 */
function getTransporter() {
  const senderEmail = process.env.EMAIL_SENDER;
  const senderPassword = process.env.EMAIL_PASSWORD;

  if (!senderEmail || !senderPassword) {
    console.error('Email credentials not configured. Set EMAIL_SENDER and EMAIL_PASSWORD in .env');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: senderPassword,
    },
  });
}

/**
 * Format a Date object into a readable string like "February 26, 2026".
 */
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Tutoring‑request response emails ─────────────────────────────────────────

/**
 * Send an email to the tutee when a tutor ACCEPTS their request.
 *
 * @param {Object} request – The TutoringRequest document (after update)
 */
async function sendRequestAcceptedEmail(request) {
  console.log('sendRequestAcceptedEmail called with:', {
    studentEmail: request.studentEmail,
    studentFirstName: request.studentFirstName,
    tutorName: request.tutorName,
    subject: request.subject,
    class: request.class,
    preferredDate: request.preferredDate,
    preferredPeriod: request.preferredPeriod,
  });

  const transporter = getTransporter();
  if (!transporter) return;

  const to = request.studentEmail;
  const subject = 'Your Tutoring Request Has Been Accepted!';

  const text = [
    `Hi ${request.studentFirstName},`,
    '',
    'Great news — your tutoring request has been accepted! Here are the details:',
    '',
    `  Tutor:   ${request.tutorName}`,
    `  Subject: ${request.subject} – ${request.class}`,
    `  Date:    ${formatDate(request.preferredDate)}`,
    `  Period:  ${request.preferredPeriod}`,
    '',
    request.responseMessage ? `Message from your tutor: "${request.responseMessage}"` : '',
    '',
    'Please make sure to show up on time. Good luck!',
    '',
    '— Peer Tutoring Team',
  ]
    .filter(line => line !== undefined)
    .join('\n');

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_SENDER,
      to,
      subject,
      text,
    });
    console.log(`Acceptance email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send acceptance email:', err);
  }
}

/**
 * Send an email to the tutee when a tutor DECLINES their request.
 *
 * @param {Object} request – The TutoringRequest document (after update)
 */
async function sendRequestDeclinedEmail(request) {
  console.log('sendRequestDeclinedEmail called with:', {
    studentEmail: request.studentEmail,
    studentFirstName: request.studentFirstName,
    responseMessage: request.responseMessage,
  });

  const transporter = getTransporter();
  if (!transporter) return;

  const to = request.studentEmail;
  const subject = 'Update on Your Tutoring Request';

  const text = [
    `Hi ${request.studentFirstName},`,
    '',
    'Unfortunately, your tutoring request has been declined.',
    '',
    request.responseMessage ? `Reason: "${request.responseMessage}"` : '',
    '',
    'You can submit a new request at any time to find another tutor.',
    '',
    '— Peer Tutoring Team',
  ]
    .filter(line => line !== undefined)
    .join('\n');

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_SENDER,
      to,
      subject,
      text,
    });
    console.log(`Declined email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send declined email:', err);
  }
}

// ─── New tutoring request email (sent to tutor) ──────────────────────────────

/**
 * Send an email to the tutor when a tutee submits a new tutoring request.
 *
 * @param {Object} request – The TutoringRequest document (after save)
 */
async function sendNewRequestEmail(request) {
  const transporter = getTransporter();
  if (!transporter) return;

  const to = request.tutorEmail;
  if (!to) {
    console.error('sendNewRequestEmail: no tutorEmail on request, skipping email');
    return;
  }

  const subject = 'New Tutoring Request';

  const text = [
    `Hi ${request.tutorName || 'Tutor'},`,
    '',
    'You have a new tutoring request! Here are the details:',
    '',
    `  Student: ${request.studentFirstName} ${request.studentLastName}`,
    `  Subject: ${request.subject} – ${request.class}`,
    `  Topic:   ${request.topic}`,
    `  Date:    ${formatDate(request.preferredDate)}`,
    `  Period:  ${request.preferredPeriod}`,
    '',
    request.additionalNotes
      ? `Additional notes from the student: "${request.additionalNotes}"`
      : '',
    '',
    'Please log in to accept or decline this request.',
    '',
    '— Peer Tutoring Team',
  ]
    .filter(line => line !== undefined)
    .join('\n');

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_SENDER,
      to,
      subject,
      text,
    });
    console.log(`New request email sent to tutor at ${to}`);
  } catch (err) {
    console.error('Failed to send new request email:', err);
  }
}

module.exports = {
  getTransporter,
  sendRequestAcceptedEmail,
  sendRequestDeclinedEmail,
  sendNewRequestEmail,
};

