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

  // Add event listeners to attendance buttons
  document.querySelectorAll('.absent-button').forEach(button => {
    button.addEventListener('click', () => updateAttendance(button.dataset.id, -1, 'daysMissed'));
  });

  document.querySelectorAll('.present-button').forEach(button => {
    button.addEventListener('click', () => updateAttendance(button.dataset.id, 0, null));
  });

  document.querySelectorAll('.makeup-button').forEach(button => {
    button.addEventListener('click', () => updateAttendance(button.dataset.id, 1, null));
  });

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

// Function to update attendance
async function updateAttendance(tutorId, change, columnToUpdate) {
  try {
    const response = await fetch(`/updateAttendance/${tutorId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ change, columnToUpdate }),
    });

    if (response.ok) {
      const updatedData = await response.json();
      // Update the attendance value in the table
      if (document.getElementById(`attendance-${tutorId}`)) {
        document.getElementById(`attendance-${tutorId}`).textContent = updatedData.attendance;
      }

      // Update the "Days Missed" column if applicable
      if (columnToUpdate === 'daysMissed' && document.getElementById(`daysMissed-${tutorId}`)) {
        document.getElementById(`daysMissed-${tutorId}`).textContent = updatedData.daysMissed;
      }
    } else {
      console.error('Failed to update attendance');
    }
  } catch (error) {
    console.error('Error updating attendance:', error);
  }
}
