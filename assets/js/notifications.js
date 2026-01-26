document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('send-notification');
  if (!sendButton) return;

  const toInput = document.getElementById('notification-to');
  const subjectInput = document.getElementById('notification-subject');
  const messageInput = document.getElementById('notification-message');
  const statusEl = document.getElementById('notification-status');

  const setStatus = (text, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = `text-sm mt-2 ${isError ? 'text-red-600' : 'text-green-700'}`;
  };

  sendButton.addEventListener('click', async () => {
    const to = toInput?.value?.trim();
    const subject = subjectInput?.value?.trim();
    const message = messageInput?.value?.trim();

    if (!to || !subject || !message) {
      setStatus('Please fill in recipient, subject, and message.', true);
      return;
    }

    setStatus('Sending...');

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, message }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to send email');
      }

      setStatus('Email sent successfully.');
    } catch (error) {
      console.error('Error sending notification:', error);
      setStatus('Error sending email. Please try again.', true);
    }
  });
});
