document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('send-notification');
  if (!sendButton) return;

  const toInput = document.getElementById('notification-to');
  const searchInput = document.getElementById('notification-search');
  const classInput = document.getElementById('notification-class');
  const periodInput = document.getElementById('notification-period');
  const subjectInput = document.getElementById('notification-subject');
  const messageInput = document.getElementById('notification-message');
  const statusEl = document.getElementById('notification-status');

  let tutorList = [];

  const loadTutors = async () => {
    if (!toInput) return;
    try {
      const res = await fetch('/api/tutor-emails');
      if (!res.ok) throw new Error('Failed to load tutors');
      const data = await res.json();
      if (!data?.tutors?.length) throw new Error('No tutors found');

      tutorList = data.tutors;
      renderTutorOptions(tutorList);
    } catch (error) {
      console.error('Error loading tutor emails:', error);
      toInput.innerHTML = '<option disabled selected>Error loading tutors</option>';
      setStatus('Could not load tutor list. Please retry.', true);
    }
  };

  const renderTutorOptions = list => {
    if (!toInput) return;
    const selected = new Set(Array.from(toInput.selectedOptions || []).map(opt => opt.value));
    toInput.innerHTML = '';
    list.forEach(tutor => {
      const option = document.createElement('option');
      option.value = tutor.email;
      option.textContent = `${tutor.name} (${tutor.email})`;
      if (selected.has(tutor.email)) {
        option.selected = true;
      }
      toInput.appendChild(option);
    });
  };

  const applyFilters = () => {
    const nameTerm = (searchInput?.value || '').toLowerCase();
    const classTerm = (classInput?.value || '').toLowerCase();
    const periodVal = (periodInput?.value || '').trim();

    const filtered = tutorList.filter(tutor => {
      const matchesName = tutor.name.toLowerCase().includes(nameTerm);
      const matchesClass = classTerm
        ? (tutor.classes || []).some(cls => cls.toLowerCase().includes(classTerm))
        : true;
      const matchesPeriod = periodVal ? String(tutor.lunchPeriod || '').trim() === periodVal : true;
      return matchesName && matchesClass && matchesPeriod;
    });

    renderTutorOptions(filtered);
  };

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (classInput) {
    classInput.addEventListener('input', applyFilters);
  }

  if (periodInput) {
    periodInput.addEventListener('change', applyFilters);
  }

  loadTutors();

  const setStatus = (text, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = `text-sm mt-2 ${isError ? 'text-red-600' : 'text-green-700'}`;
  };

  sendButton.addEventListener('click', async () => {
    const to = Array.from(toInput?.selectedOptions || [])
      .map(opt => opt.value.trim())
      .filter(Boolean);
    const subject = subjectInput?.value?.trim();
    const message = messageInput?.value?.trim();

    if (!to.length || !subject || !message) {
      setStatus('Please select at least one recipient and fill in subject and message.', true);
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
