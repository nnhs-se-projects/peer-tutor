/**
 * Attendance page: mark each tutor scheduled today as absent, tardy, or present,
 * log makeup sessions, and submit the lunch period's attendance.
 */

const SCHOOL_TIME_ZONE = 'America/Chicago';

// Today's date in Central time as YYYY-MM-DD
const todayInSchoolZone = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: SCHOOL_TIME_ZONE }).format(new Date());

document.addEventListener('DOMContentLoaded', function () {
  const todayName = document.getElementById('studentTable').dataset.today;
  const lunchFilter = document.getElementById('lunchFilter');
  const makeupNameSearch = document.getElementById('makeupNameSearch');
  const submitBtn = document.getElementById('attendanceSubmitBtn');

  const tutorRows = () => Array.from(document.querySelectorAll('.tutor-row'));
  const makeupRows = () => Array.from(document.querySelectorAll('.makeup-row'));

  // Tutors in the selected lunch period who are scheduled to tutor today
  const isScheduledRow = row =>
    row.dataset.lunch === lunchFilter.value && row.dataset.days.split(',').includes(todayName);
  const scheduledRows = () => tutorRows().filter(isScheduledRow);
  const selectedMakeupRows = () =>
    makeupRows().filter(
      row => row.dataset.lunch === lunchFilter.value && row.dataset.attendanceStatus === 'makeup'
    );

  // Show today's date under the title
  document.getElementById('currentDate').innerHTML =
    `<span style="color: #FF8800; font-weight: 700;">${escapeHtml(todayName)}</span>, ` +
    new Date().toLocaleDateString('en-US', {
      timeZone: SCHOOL_TIME_ZONE,
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  // Sorting and column search for the main table, limited to tutors scheduled today
  const mainTable = window.TableTools.init({
    tableId: 'studentTable',
    numericColumns: [2],
    rowFilter: row => !row.classList.contains('tutor-row') || isScheduledRow(row),
  });

  // Makeup rows: tutors in the selected lunch period who have missed days, or anyone
  // matching the name search (so leads can log makeups ahead of a planned absence)
  function filterMakeupRows() {
    const searchQuery = makeupNameSearch.value.trim().toLowerCase();
    let visibleCount = 0;
    let lunchCount = 0;

    makeupRows().forEach(row => {
      const fullName = `${row.dataset.firstName} ${row.dataset.lastName}`.toLowerCase();
      const daysMissed = parseFloat(row.dataset.daysMissed) || 0;
      const matchesLunch = row.dataset.lunch === lunchFilter.value;
      const matchesSearch = !searchQuery || fullName.includes(searchQuery);
      const visible = matchesLunch && matchesSearch && (daysMissed > 0 || Boolean(searchQuery));

      row.style.display = visible ? '' : 'none';
      if (matchesLunch) lunchCount++;
      if (visible) visibleCount++;
    });

    // Show or hide the "no eligible tutors" placeholder
    let noMakeupRow = document.getElementById('noMakeupRow');
    if (visibleCount === 0) {
      if (!noMakeupRow) {
        noMakeupRow = document.createElement('tr');
        noMakeupRow.id = 'noMakeupRow';
        noMakeupRow.innerHTML = '<td colspan="4" class="text-center py-4"></td>';
        document.querySelector('#makeupTable tbody').appendChild(noMakeupRow);
      }
      noMakeupRow.cells[0].textContent =
        searchQuery && lunchCount > 0
          ? 'No tutors matched your search for this lunch period'
          : 'No tutors need makeup for this lunch period';
      noMakeupRow.style.display = '';
    } else if (noMakeupRow) {
      noMakeupRow.style.display = 'none';
    }
  }

  // Submit is enabled once every scheduled tutor is marked (or, on a day with nobody
  // scheduled for this period, once a makeup is selected)
  function updateSubmitState() {
    const scheduled = scheduledRows();
    const allMarked = scheduled.every(row => row.dataset.attendanceStatus);
    const canSubmit = allMarked && (scheduled.length > 0 || selectedMakeupRows().length > 0);

    submitBtn.disabled = !canSubmit;
    submitBtn.classList.toggle('button-disabled', !canSubmit);
  }

  function refreshRows() {
    mainTable.applyFilters();
    filterMakeupRows();
    updateSubmitState();
  }

  // Select one of a row's A / T / P buttons; clicking the selected one clears the row
  function selectAttendanceButton(clickedButton) {
    const row = clickedButton.closest('tr');
    const buttons = row.querySelectorAll('.absent-button, .tardy-button, .present-button');
    const isAlreadySelected = clickedButton.classList.contains('button-selected');

    buttons.forEach(button => {
      const selected = !isAlreadySelected && button === clickedButton;
      button.classList.toggle('button-selected', selected);
      // Other buttons are greyed out but stay clickable
      button.classList.toggle('button-disabled', !isAlreadySelected && !selected);
    });

    if (isAlreadySelected) {
      delete row.dataset.attendanceStatus;
    } else {
      row.dataset.attendanceStatus = clickedButton.dataset.action;
    }
    updateSubmitState();
  }

  function setMakeupSelected(row, selected) {
    row.querySelector('.makeup-button').classList.toggle('button-selected', selected);
    if (selected) {
      row.dataset.attendanceStatus = 'makeup';
    } else {
      delete row.dataset.attendanceStatus;
    }
  }

  function setFutureMakeup(row, checked, date) {
    const checkbox = row.querySelector('.future-makeup-checkbox');
    const dateInput = row.querySelector('.future-absence-date');

    checkbox.checked = checked;
    dateInput.style.display = checked ? '' : 'none';
    if (date !== undefined) dateInput.value = date;

    if (checked) {
      row.dataset.futureMakeup = 'true';
      // A future makeup is still a makeup
      setMakeupSelected(row, true);
    } else {
      delete row.dataset.futureMakeup;
    }
  }

  tutorRows().forEach(row => {
    row.querySelectorAll('.absent-button, .tardy-button, .present-button').forEach(button => {
      button.addEventListener('click', () => selectAttendanceButton(button));
    });
  });

  makeupRows().forEach(row => {
    const button = row.querySelector('.makeup-button');
    const checkbox = row.querySelector('.future-makeup-checkbox');
    const dateInput = row.querySelector('.future-absence-date');

    button.addEventListener('click', () => {
      setMakeupSelected(row, !button.classList.contains('button-selected'));
      updateSubmitState();
    });
    checkbox.addEventListener('change', () => {
      setFutureMakeup(row, checkbox.checked);
      updateSubmitState();
    });
    dateInput.addEventListener('change', () => {
      if (dateInput.value) setFutureMakeup(row, true);
      updateSubmitState();
    });
  });

  // Pre-select the buttons from attendance already saved today for this lunch period
  async function loadSavedAttendance(lunchPeriod) {
    try {
      const res = await fetch(
        `/attendance/getAttendance?date=${todayInSchoolZone()}&lunchPeriod=${encodeURIComponent(lunchPeriod)}`
      );
      const json = res.ok ? await res.json() : null;
      const savedTutors =
        json && json.data && Array.isArray(json.data.tutors) ? json.data.tutors : null;
      if (!savedTutors) return;

      const savedById = new Map(savedTutors.map(t => [String(t.tutorId), t]));

      tutorRows()
        .filter(row => row.dataset.lunch === lunchPeriod)
        .forEach(row => {
          const saved = savedById.get(row.dataset.tutorId);
          const status = saved && saved.status !== 'makeup' ? saved.status : null;
          row.querySelectorAll('.absent-button, .tardy-button, .present-button').forEach(btn => {
            btn.classList.toggle(
              'button-selected',
              Boolean(status) && btn.dataset.action === status
            );
            btn.classList.toggle(
              'button-disabled',
              Boolean(status) && btn.dataset.action !== status
            );
          });
          if (status) {
            row.dataset.attendanceStatus = status;
          } else {
            delete row.dataset.attendanceStatus;
          }
        });

      makeupRows()
        .filter(row => row.dataset.lunch === lunchPeriod)
        .forEach(row => {
          const saved = savedById.get(row.dataset.tutorId);
          const isMakeup = Boolean(saved) && saved.status === 'makeup';
          setMakeupSelected(row, isMakeup);
          // Stored dates are midnight UTC, so read the date part in UTC
          const futureDate =
            isMakeup && saved.futureAbsenceDate
              ? new Date(saved.futureAbsenceDate).toISOString().slice(0, 10)
              : '';
          setFutureMakeup(row, isMakeup && Boolean(saved.futureMakeup), futureDate);
        });
    } catch (err) {
      console.warn('Could not load saved attendance:', err);
    } finally {
      updateSubmitState();
    }
  }

  // Attendance for the selected lunch period, ready to send to the server
  function buildAttendancePayload() {
    const tutors = scheduledRows()
      .filter(row => row.dataset.attendanceStatus)
      .map(row => ({
        tutorId: Number(row.dataset.tutorId),
        status: row.dataset.attendanceStatus,
      }));

    selectedMakeupRows().forEach(row => {
      const entry = { tutorId: Number(row.dataset.tutorId), status: 'makeup' };
      const futureDate = row.querySelector('.future-absence-date').value;
      if (row.dataset.futureMakeup === 'true') {
        entry.futureMakeup = true;
        if (futureDate) entry.futureAbsenceDate = futureDate;
      }
      tutors.push(entry);
    });

    if (tutors.length === 0) return null;

    return {
      date: todayInSchoolZone(),
      lunchPeriod: Number(lunchFilter.value),
      tutors,
    };
  }

  // ── Submit with confirmation ──
  const modal = document.getElementById('attendanceConfirmModal');
  const okBtn = document.getElementById('modalOkBtn');
  const noBtn = document.getElementById('modalNoBtn');
  let submitting = false;

  function showModal() {
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }

  function hideModal() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }

  submitBtn.addEventListener('click', event => {
    event.preventDefault();
    if (!submitBtn.disabled) showModal();
  });

  noBtn.addEventListener('click', hideModal);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !submitting) hideModal();
  });

  okBtn.addEventListener('click', async () => {
    // Ignore extra clicks while the first submission is in flight
    if (submitting) return;

    const payload = buildAttendancePayload();
    if (!payload) {
      hideModal();
      return;
    }

    submitting = true;
    okBtn.disabled = true;

    try {
      const res = await fetch('/attendance/logSubmission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${res.status})`);
      }

      window.location.href = '/leadHome?fromAttendance=true';
    } catch (err) {
      console.error('Failed to save attendance:', err);
      hideModal();
      alert(`Failed to save attendance: ${err.message}`);
      submitting = false;
      okBtn.disabled = false;
    }
  });

  // ── Export ──
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportAttendanceToTextFile);
  }

  const exportSpreadsheetBtn = document.getElementById('exportSpreadsheetBtn');
  if (exportSpreadsheetBtn) {
    exportSpreadsheetBtn.addEventListener('click', exportAttendanceToSpreadsheet);
  }

  lunchFilter.addEventListener('change', () => {
    refreshRows();
    loadSavedAttendance(lunchFilter.value);
  });
  makeupNameSearch.addEventListener('input', filterMakeupRows);

  refreshRows();
  loadSavedAttendance(lunchFilter.value);
});

const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);

function buildAttendanceExportData() {
  const mainRows = Array.from(document.querySelectorAll('.tutor-row')).map(row => [
    (row.cells[0]?.textContent || '').trim(),
    (row.cells[1]?.textContent || '').trim(),
    (row.cells[2]?.textContent || '').trim(),
    (row.cells[3]?.textContent || '').trim(),
    row.dataset.attendanceStatus ? capitalize(row.dataset.attendanceStatus) : 'Unmarked',
  ]);

  const makeupRows = Array.from(document.querySelectorAll('.makeup-row')).map(row => [
    (row.cells[0]?.textContent || '').trim(),
    (row.cells[1]?.textContent || '').trim(),
    (row.cells[2]?.textContent || '').trim(),
    row.dataset.attendanceStatus === 'makeup' ? 'Makeup' : 'Not Selected',
  ]);

  return {
    mainHeaders: ['First Name', 'Last Name', 'Days Missed', 'Days Available', 'Attendance'],
    mainRows,
    makeupHeaders: ['First Name', 'Last Name', 'Days Missed', 'Makeup'],
    makeupRows,
  };
}

function exportAttendanceToTextFile() {
  const exportData = buildAttendanceExportData();
  const content = [
    'Tutor Attendance',
    exportData.mainHeaders.join('\t'),
    ...exportData.mainRows.map(row => row.join('\t')),
    '',
    'Makeup Attendance',
    exportData.makeupHeaders.join('\t'),
    ...exportData.makeupRows.map(row => row.join('\t')),
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = window.TableExport.buildTimestampedFileName({
    baseName: 'attendance-export',
    extension: 'txt',
  });
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

async function exportAttendanceToSpreadsheet() {
  const exportData = buildAttendanceExportData();

  try {
    await window.TableExport.exportTablesToSpreadsheet({
      fileName: window.TableExport.buildTimestampedFileName({
        baseName: 'attendance-export',
        extension: 'xlsx',
      }),
      sheets: [
        {
          sheetName: 'Attendance',
          headers: exportData.mainHeaders,
          rows: exportData.mainRows,
        },
        {
          sheetName: 'Makeup Attendance',
          headers: exportData.makeupHeaders,
          rows: exportData.makeupRows,
        },
      ],
    });
  } catch (error) {
    console.error('Spreadsheet export failed:', error);
    alert('Unable to export spreadsheet right now. Please try again.');
  }
}
