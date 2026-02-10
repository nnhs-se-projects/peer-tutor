function toggleSearch(column) {
  const headerText = document.getElementById(`headerText${column}`);
  const searchInput = document.getElementById(`searchInput${column}`);
  const icons = headerText.nextElementSibling;

  // Calculate the width of the header and apply it to the search input
  const headerHeight = headerText.offsetHeight + 5;
  const headerWidth = headerText.offsetWidth + icons.offsetWidth + 100;

  if (searchInput.style.display === 'none' || searchInput.style.display === '') {
    headerText.style.display = 'none';
    searchInput.style.display = 'inline-block';
    searchInput.style.height = `${headerHeight}px`;
    searchInput.style.width = `${headerWidth}px`;

    icons.style.display = 'none';
    searchInput.focus();
  } else {
    if (searchInput.value === '') {
      headerText.style.display = 'block';
      searchInput.style.display = 'none';
      icons.style.display = 'flex';
    }
  }
}

// Initialize the table with event listeners and animations
document.addEventListener('DOMContentLoaded', function () {
  // Add click event listeners to sort icons
  document.querySelectorAll('.sort-icon').forEach(icon => {
    icon.addEventListener('click', function () {
      const dataIndex = parseInt(this.getAttribute('data-index'));
      sortTable(dataIndex);
    });
  });

  // Add click event listeners to search icons
  document.querySelectorAll('.search-icon').forEach(icon => {
    icon.addEventListener('click', function () {
      const dataIndex = parseInt(this.getAttribute('data-index'));
      toggleSearch(dataIndex);
    });
  });

  // Add input event listeners to search inputs
  document.querySelectorAll('.search-input').forEach(input => {
    input.addEventListener('input', function () {
      const dataIndex = parseInt(this.getAttribute('data-index'));
      filterTable(dataIndex);
    });
  });

  // Handle clicking outside search inputs
  document.addEventListener('click', function (event) {
    document.querySelectorAll('.search-input').forEach((input, index) => {
      if (
        !input.contains(event.target) &&
        !document.querySelector(`.search-icon[data-index="${index}"]`).contains(event.target)
      ) {
        if (input.value === '') {
          input.style.display = 'none';
          document.getElementById(`headerText${index}`).style.display = 'block';
          document.getElementById(`headerText${index}`).nextElementSibling.style.display = 'flex';
        }
      }
    });
  });

  // Add event listeners to attendance buttons (UI toggle only; DB update happens on submit)
  document.querySelectorAll('.absent-button, .present-button, .makeup-button').forEach(button => {
    button.addEventListener('click', () => {
      disableOtherButtons(button);
    });
  });

  // Re-evaluate submit availability when lunch period selection changes
  const lunchFilter = document.getElementById('lunchFilter');
  if (lunchFilter) {
    lunchFilter.addEventListener('change', () => {
      updateSubmitState();
      loadSavedAttendance(lunchFilter.value);
    });
  }

  // Initialize submit button state based on whether every row has a selection
  updateSubmitState();

  // Load any previously saved attendance for today + the currently selected lunch
  if (lunchFilter) {
    loadSavedAttendance(lunchFilter.value);
  }

  // Animation for table rows on load
  const rows = document.querySelectorAll('#studentTable tbody tr');
  rows.forEach((row, index) => {
    row.style.opacity = '0';
    setTimeout(() => {
      row.style.animation = `fadeIn 0.5s ease-in-out forwards ${index * 0.05}s`;
    }, 100);
  });
});

function filterTable(column) {
  const input = document.getElementById(`searchInput${column}`).value.toLowerCase();
  const table = document.getElementById('studentTable');
  const rows = table.getElementsByTagName('tr');

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('td');
    if (cells[column]) {
      const cellText = cells[column].textContent || cells[column].innerText;
      rows[i].style.display = cellText.toLowerCase().includes(input) ? '' : 'none';
    }
  }
}

let currentSort = { columnIndex: null, isDescending: false };

function sortTable(column) {
  const table = document.getElementById('studentTable');
  let rows = Array.from(table.getElementsByTagName('tr')).slice(1);
  const isNumeric = column === 2; // Days Missed column is numeric

  const reverse = currentSort.columnIndex === column ? !currentSort.isDescending : false;
  rows.sort((rowA, rowB) => {
    let cellA = rowA.getElementsByTagName('td')[column].textContent.trim();
    let cellB = rowB.getElementsByTagName('td')[column].textContent.trim();

    if (isNumeric) {
      return reverse
        ? parseFloat(cellB) - parseFloat(cellA)
        : parseFloat(cellA) - parseFloat(cellB);
    } else {
      return reverse ? cellB.localeCompare(cellA) : cellA.localeCompare(cellB);
    }
  });

  rows.forEach(row => table.appendChild(row));

  currentSort = { columnIndex: column, isDescending: reverse };
  updateSortIcons(column, reverse);
}

function updateSortIcons(column, isDescending) {
  document.querySelectorAll('.sort-icon').forEach(icon => {
    icon.textContent = '↑↓';
  });

  const icon = document.getElementById(`sortIcon${column}`);
  icon.textContent = isDescending ? '↓' : '↑';
}

// Function to toggle attendance buttons in the same row
function disableOtherButtons(clickedButton) {
  // Find the parent row
  const row = clickedButton.closest('tr');
  if (!row) return;

  // Get all buttons in this row
  const buttons = row.querySelectorAll('.absent-button, .present-button, .makeup-button');

  // Check if the clicked button is already selected
  const isAlreadySelected = clickedButton.classList.contains('button-selected');

  const status = clickedButton.dataset.action;

  // If clicking the same button, deselect all
  if (isAlreadySelected) {
    buttons.forEach(button => {
      button.classList.remove('button-disabled');
      button.classList.remove('button-selected');
    });
    delete row.dataset.attendanceStatus;
  } else {
    // Clicking a different button: select clicked one, grey out others (but keep clickable)
    buttons.forEach(button => {
      if (button !== clickedButton) {
        button.classList.add('button-disabled');
        button.classList.remove('button-selected');
      } else {
        button.classList.remove('button-disabled');
        button.classList.add('button-selected');
      }
    });
    row.dataset.attendanceStatus = status;
  }

  updateSubmitState();
}

// Fetch previously saved attendance for today + lunchPeriod and pre-select buttons
async function loadSavedAttendance(lunchPeriod) {
  if (!lunchPeriod) return;

  try {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const res = await fetch(`/attendance/getAttendance?date=${dateStr}&lunchPeriod=${lunchPeriod}`);
    if (!res.ok) return;

    const json = await res.json();
    if (!json.success || !json.data || !Array.isArray(json.data.tutors)) return;

    // Build a map of tutorId → saved status
    const savedStatuses = {};
    json.data.tutors.forEach(t => {
      savedStatuses[t.tutorId] = t.status; // 'present' | 'absent' | 'makeup'
    });

    // Walk every visible tutor row and pre-select the matching button
    document.querySelectorAll('.tutor-row').forEach(row => {
      const tutorId = Number(row.getAttribute('data-tutor-id'));
      const savedStatus = savedStatuses[tutorId];
      if (!savedStatus) return;

      const buttons = row.querySelectorAll('.absent-button, .present-button, .makeup-button');
      buttons.forEach(btn => {
        if (btn.dataset.action === savedStatus) {
          btn.classList.add('button-selected');
          btn.classList.remove('button-disabled');
        } else {
          btn.classList.add('button-disabled');
          btn.classList.remove('button-selected');
        }
      });
      row.dataset.attendanceStatus = savedStatus;
    });

    updateSubmitState();
  } catch (err) {
    console.warn('Could not load saved attendance:', err);
  }
}

// Helper: convert a status string to its numeric weight for days missed
function statusToWeight(status) {
  if (status === 'absent') return 1;
  if (status === 'makeup') return -1;
  return 0; // 'present' or undefined
}

// Attendance diff logic is now handled server-side in logSubmission.
// This function is kept as a no-op so existing submit handlers don't error.
async function updateAttendanceBatch(payload) {
  // Server-side logSubmission now handles diffing old vs new statuses
  // and updating each Tutor's attendance field automatically.
  return;
}

// Expose so the submit handler can call it
window.updateAttendanceBatch = updateAttendanceBatch;

// Disable submit until every tutor row has a selected attendance status
function updateSubmitState() {
  const submitBtn = document.getElementById('attendanceSubmitBtn');
  if (!submitBtn) return;

  const rows = Array.from(document.querySelectorAll('.tutor-row'));
  const lunchFilter = document.getElementById('lunchFilter');
  let selectedLunch = lunchFilter ? lunchFilter.value : null;

  if (!selectedLunch && rows.length > 0) {
    selectedLunch = rows[0].getAttribute('data-lunch');
  }

  const isLunchComplete = lunchVal => {
    // Only consider rows that are visible (available today and matching lunch period)
    const lunchRows = rows.filter(
      row => row.getAttribute('data-lunch') === lunchVal && row.style.display !== 'none'
    );
    return lunchRows.length > 0 && lunchRows.every(row => row.dataset.attendanceStatus);
  };

  let canSubmit = false;

  if (selectedLunch) {
    canSubmit = isLunchComplete(selectedLunch);
  }

  if (canSubmit) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('button-disabled');
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.add('button-disabled');
  }
}

// Build an attendance payload for the currently selected lunch period
function buildAttendancePayload() {
  const lunchFilter = document.getElementById('lunchFilter');
  const selectedLunch = lunchFilter ? lunchFilter.value : null;

  if (!selectedLunch) return null;

  const rows = Array.from(document.querySelectorAll('.tutor-row')).filter(
    row =>
      row.getAttribute('data-lunch') === selectedLunch &&
      row.style.display !== 'none' &&
      row.dataset.attendanceStatus
  );

  if (rows.length === 0) return null;

  const tutors = rows.map(row => {
    const tutorId = row.getAttribute('data-tutor-id');
    const mongoId = row.getAttribute('data-mongo-id') || '';
    const firstName = row.getAttribute('data-first-name') || '';
    const lastName = row.getAttribute('data-last-name') || '';
    const email = row.getAttribute('data-email') || '';

    return {
      _id: mongoId,
      tutorId: tutorId ? Number(tutorId) : undefined,
      tutorFirstName: firstName,
      tutorLastName: lastName,
      email,
      status: row.dataset.attendanceStatus,
    };
  });

  // Send a stable YYYY-MM-DD date so logSubmission always matches the same record
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  return {
    date: `${yyyy}-${mm}-${dd}`,
    lunchPeriod: Number(selectedLunch),
    tutors,
  };
}

// Expose payload builder for inline scripts
window.buildAttendancePayload = buildAttendancePayload;

async function sendAttendancePayload(payload) {
  if (!payload) return;
  try {
    await fetch('/attendance/logSubmission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Failed to send attendance payload', err);
  }
}

window.sendAttendancePayload = sendAttendancePayload;
