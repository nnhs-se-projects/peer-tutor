document.addEventListener('DOMContentLoaded', function () {
  // Set up date display
  updateDateDisplay();

  // Set up event listeners for attendance buttons
  setupAttendanceButtons();

  // Set up lunch period filter
  setupLunchFilter();

  // Set up search and sort functionality
  setupTableFunctionality();
});

// Function to update the date display
function updateDateDisplay() {
  const dateElement = document.getElementById('currentDate');
  const today = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = today.toLocaleDateString('en-US', options);

  dateElement.textContent = formattedDate;

  // Filter tutors based on day of week
  filterTutorsByDay(today.getDay());
}

// Function to filter tutors based on day of week
function filterTutorsByDay(dayNum) {
  // Convert day number to day name
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dayNum];

  const rows = document.querySelectorAll('#studentTable tbody tr');

  rows.forEach(row => {
    const daysAvailable = row.getAttribute('data-days');

    // If it's the weekend, don't hide any tutors since there's no school
    if (dayNum === 0 || dayNum === 6) {
      row.classList.remove('hidden');
      row.style.display = '';
      return;
    }

    // If the tutor is available on this day, show them
    if (daysAvailable && daysAvailable.includes(dayName)) {
      row.classList.remove('hidden');
      row.style.display = '';
    } else {
      // Hide tutors who are not available on this day
      row.classList.add('hidden');
      row.style.display = 'none';
    }
  });

  // After filtering by day, apply the lunch period filter if it's already set
  const lunchFilter = document.getElementById('lunchFilter');
  if (lunchFilter && lunchFilter.value !== 'all') {
    applyLunchFilter(lunchFilter.value);
  }
}

// Function to set up attendance buttons
function setupAttendanceButtons() {
  // Get all buttons
  const buttons = document.querySelectorAll('.absent-button, .present-button, .makeup-button');

  buttons.forEach(button => {
    button.addEventListener('click', function () {
      const tutorId = this.getAttribute('data-id');
      const action = this.getAttribute('data-action');

      // Define change based on action
      let change = 0;
      if (action === 'absent') {
        change = 1; // Increment days missed
      } else if (action === 'makeup') {
        change = -1; // Decrement days missed
      } // 'present' doesn't change days missed (change = 0)

      // Update UI first for immediate feedback
      const daysMissedElement = document.getElementById(`daysMissed-${tutorId}`);
      if (daysMissedElement) {
        let currentValue = parseInt(daysMissedElement.textContent) || 0;
        daysMissedElement.textContent = currentValue + change;
      }

      // Send the update to the server
      updateAttendance(tutorId, change);
    });
  });
}

// Function to update attendance on the server
function updateAttendance(tutorId, change) {
  fetch('/attendance/updateAttendance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tutorId: tutorId,
      change: change,
    }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Server response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Success: Attendance updated to', data.attendance);

        // Update the UI with the actual value from the server if it differs
        const daysMissedElement = document.getElementById(`daysMissed-${tutorId}`);
        if (daysMissedElement) {
          daysMissedElement.textContent = data.attendance;
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      // Revert the UI update if server update failed
      const daysMissedElement = document.getElementById(`daysMissed-${tutorId}`);
      if (daysMissedElement) {
        let currentValue = parseInt(daysMissedElement.textContent) || 0;
        daysMissedElement.textContent = currentValue - change;
      }
    });
}

// Function to apply the lunch period filter
function applyLunchFilter(selectedLunch) {
  console.log('Filtering for lunch period:', selectedLunch);
  const rows = document.querySelectorAll('#studentTable tbody tr');
  console.log('Total rows found:', rows.length);

  let visibleCount = 0;
  let hiddenCount = 0;

  rows.forEach(row => {
    // Skip rows that are already hidden by day filter
    if (row.classList.contains('hidden')) {
      console.log('Row already hidden by day filter');
      return;
    }

    const lunchPeriod = row.getAttribute('data-lunch');
    console.log('Row lunch period:', lunchPeriod, 'Selected:', selectedLunch);

    // Convert both to strings for comparison
    if (selectedLunch === 'all' || lunchPeriod === selectedLunch.toString()) {
      row.style.display = '';
      visibleCount++;
      console.log('Showing row with lunch period:', lunchPeriod);
    } else {
      row.style.display = 'none';
      hiddenCount++;
      console.log('Hiding row with lunch period:', lunchPeriod);
    }
  });

  console.log(`Filter results: ${visibleCount} visible rows, ${hiddenCount} hidden rows`);
}

// Function to set up lunch filter
function setupLunchFilter() {
  const lunchFilter = document.getElementById('lunchFilter');

  lunchFilter.addEventListener('change', function () {
    const selectedLunch = this.value;
    applyLunchFilter(selectedLunch);
  });
}

// Function to set up table functionality (search and sort)
function setupTableFunctionality() {
  // Search functionality
  const searchIcons = document.querySelectorAll('.search-icon');
  searchIcons.forEach(icon => {
    icon.addEventListener('click', function () {
      const index = this.getAttribute('data-index');
      const searchInput = document.getElementById(`searchInput${index}`);

      // Toggle search input visibility
      if (searchInput.style.display === 'none') {
        searchInput.style.display = 'block';
        searchInput.focus();
      } else {
        searchInput.style.display = 'none';
        searchInput.value = '';
        filterTable('', index);
      }
    });
  });

  // Set up search input event listeners
  const searchInputs = document.querySelectorAll('.search-input');
  searchInputs.forEach(input => {
    input.addEventListener('input', function () {
      const index = this.getAttribute('data-index');
      const searchTerm = this.value.toLowerCase();
      filterTable(searchTerm, index);
    });
  });

  // Sort functionality
  const sortIcons = document.querySelectorAll('.sort-icon');
  sortIcons.forEach(icon => {
    icon.addEventListener('click', function () {
      const index = this.getAttribute('data-index');
      sortTable(index);
    });
  });
}

// Function to filter table
function filterTable(term, columnIndex) {
  const rows = document.querySelectorAll('#studentTable tbody tr');

  rows.forEach(row => {
    // Skip rows already hidden by other filters
    if (row.style.display === 'none' && row.classList.contains('hidden')) {
      return;
    }

    const cell = row.getElementsByTagName('td')[columnIndex];
    if (cell) {
      const text = cell.textContent || cell.innerText;
      if (text.toLowerCase().indexOf(term) > -1) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });
}

// Function to sort table
function sortTable(columnIndex) {
  const table = document.getElementById('studentTable');
  let switching = true;
  let dir = 'asc';
  let shouldSwitch = false;
  let switchcount = 0;

  // Sort icon that was clicked
  const sortIcon = document.getElementById(`sortIcon${columnIndex}`);

  // Check if we need to switch direction
  if (sortIcon.classList.contains('sorting-asc')) {
    dir = 'desc';
    sortIcon.classList.remove('sorting-asc');
    sortIcon.classList.add('sorting-desc');
  } else if (sortIcon.classList.contains('sorting-desc')) {
    dir = 'asc';
    sortIcon.classList.remove('sorting-desc');
    sortIcon.classList.add('sorting-asc');
  } else {
    // First time sorting this column
    sortIcon.classList.add('sorting-asc');

    // Reset other sort icons
    const allSortIcons = document.querySelectorAll('.sort-icon');
    allSortIcons.forEach(icon => {
      if (icon !== sortIcon) {
        icon.classList.remove('sorting-asc', 'sorting-desc');
      }
    });
  }

  // Perform the sort
  while (switching) {
    switching = false;
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length - 1; i++) {
      shouldSwitch = false;

      // Skip rows that are hidden
      if (rows[i].style.display === 'none' || rows[i + 1].style.display === 'none') {
        continue;
      }

      const x = rows[i].getElementsByTagName('td')[columnIndex];
      const y = rows[i + 1].getElementsByTagName('td')[columnIndex];

      if (!x || !y) continue;

      let xContent = x.textContent || x.innerText;
      let yContent = y.textContent || y.innerText;

      // Attempt to parse as numbers if possible
      const xNum = parseFloat(xContent);
      const yNum = parseFloat(yContent);

      if (!isNaN(xNum) && !isNaN(yNum)) {
        // Both are numbers, compare numerically
        if ((dir === 'asc' && xNum > yNum) || (dir === 'desc' && xNum < yNum)) {
          shouldSwitch = true;
          break;
        }
      } else {
        // Compare as strings
        if (
          (dir === 'asc' && xContent.toLowerCase() > yContent.toLowerCase()) ||
          (dir === 'desc' && xContent.toLowerCase() < yContent.toLowerCase())
        ) {
          shouldSwitch = true;
          break;
        }
      }
    }

    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount++;
    } else {
      if (switchcount === 0 && dir === 'asc') {
        dir = 'desc';
        switching = true;
      }
    }
  }
}
