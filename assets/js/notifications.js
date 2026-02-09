document.addEventListener('DOMContentLoaded', () => {
  // ==================== ABSENCE NOTIFICATIONS ====================
  const absenceThreshold = document.getElementById('absence-threshold');
  const loadAbsentBtn = document.getElementById('load-absent-tutors');
  const notifyAllAbsentBtn = document.getElementById('notify-all-absent');
  const absentTutorsBody = document.getElementById('absent-tutors-body');
  const absenceStatusEl = document.getElementById('absence-status');

  let absentTutorsList = [];

  const setAbsenceStatus = (text, isError = false) => {
    if (!absenceStatusEl) return;
    absenceStatusEl.textContent = text;
    absenceStatusEl.className = `text-sm mt-2 ${isError ? 'text-red-600' : 'text-green-700'}`;
  };

  const renderAbsentTutorsTable = tutors => {
    if (!absentTutorsBody) return;

    if (!tutors.length) {
      absentTutorsBody.innerHTML = `
        <tr>
          <td colspan="4" class="px-4 py-8 text-center text-gray-500">
            No tutors found with the specified number of absences
          </td>
        </tr>`;
      if (notifyAllAbsentBtn) notifyAllAbsentBtn.disabled = true;
      return;
    }

    absentTutorsBody.innerHTML = tutors
      .map(
        tutor => `
        <tr class="border-t hover:bg-gray-50">
          <td class="px-4 py-2">${tutor.name}</td>
          <td class="px-4 py-2 text-gray-600">${tutor.email}</td>
          <td class="px-4 py-2 text-center">
            <span class="inline-block px-2 py-1 rounded ${tutor.absenceCount >= 2 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'} font-semibold">
              ${tutor.absenceCount}
            </span>
          </td>
          <td class="px-4 py-2 text-center">
            <button
              class="notify-single-btn bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
              data-email="${tutor.email}"
              data-name="${tutor.name}"
              data-absences="${tutor.absenceCount}"
            >
              Notify
            </button>
          </td>
        </tr>`
      )
      .join('');

    if (notifyAllAbsentBtn) notifyAllAbsentBtn.disabled = false;

    // Add click handlers to individual notify buttons
    document.querySelectorAll('.notify-single-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const email = btn.dataset.email;
        const name = btn.dataset.name;
        const absences = parseInt(btn.dataset.absences) || 1;

        btn.disabled = true;
        btn.textContent = 'Sending...';

        try {
          const response = await fetch('/api/notifications/absence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: new Date().toLocaleDateString(),
              tutors: [{ email, name, absenceCount: absences }],
            }),
          });

          const result = await response.json();
          if (result.results?.sent?.length) {
            btn.textContent = 'Sent ✓';
            btn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            btn.classList.add('bg-green-500');
            setAbsenceStatus(`Notification sent to ${name}`);
          } else {
            throw new Error(result.results?.failed?.[0]?.reason || 'Failed to send');
          }
        } catch (error) {
          btn.textContent = 'Failed';
          btn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
          btn.classList.add('bg-red-500');
          setAbsenceStatus(`Failed to notify ${name}: ${error.message}`, true);
        }
      });
    });
  };

  const loadAbsentTutors = async () => {
    if (!absentTutorsBody) return;

    const minAbsences = absenceThreshold?.value || 1;
    absentTutorsBody.innerHTML = `
      <tr>
        <td colspan="4" class="px-4 py-8 text-center text-gray-500">
          Loading tutors...
        </td>
      </tr>`;

    try {
      const response = await fetch(`/api/tutors/absences?min=${minAbsences}`);
      if (!response.ok) throw new Error('Failed to load tutors');

      const data = await response.json();
      absentTutorsList = data.tutors || [];
      renderAbsentTutorsTable(absentTutorsList);
      setAbsenceStatus(`Found ${absentTutorsList.length} tutor(s) with ${minAbsences}+ absence(s)`);
    } catch (error) {
      console.error('Error loading absent tutors:', error);
      absentTutorsBody.innerHTML = `
        <tr>
          <td colspan="4" class="px-4 py-8 text-center text-red-500">
            Error loading tutors. Please try again.
          </td>
        </tr>`;
      setAbsenceStatus('Failed to load tutors with absences', true);
    }
  };

  if (loadAbsentBtn) {
    loadAbsentBtn.addEventListener('click', loadAbsentTutors);
  }

  if (notifyAllAbsentBtn) {
    notifyAllAbsentBtn.addEventListener('click', async () => {
      if (!absentTutorsList.length) return;

      const confirmSend = confirm(
        `Send absence notifications to ${absentTutorsList.length} tutor(s)?`
      );
      if (!confirmSend) return;

      notifyAllAbsentBtn.disabled = true;
      notifyAllAbsentBtn.textContent = 'Sending...';
      setAbsenceStatus('Sending notifications...');

      try {
        const minAbsences = absenceThreshold?.value || 1;
        const response = await fetch('/api/notifications/absence/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ minAbsences: parseInt(minAbsences) }),
        });

        const result = await response.json();
        setAbsenceStatus(result.message || 'Notifications sent');
        notifyAllAbsentBtn.textContent = 'Notify All Listed';
        notifyAllAbsentBtn.disabled = false;

        // Refresh the table to show updated status
        loadAbsentTutors();
      } catch (error) {
        console.error('Error sending bulk notifications:', error);
        setAbsenceStatus('Failed to send bulk notifications', true);
        notifyAllAbsentBtn.textContent = 'Notify All Listed';
        notifyAllAbsentBtn.disabled = false;
      }
    });
  }

  // ==================== MANUAL NOTIFICATIONS ====================
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
