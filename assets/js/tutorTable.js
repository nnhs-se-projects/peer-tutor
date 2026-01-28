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

document.addEventListener('DOMContentLoaded', function () {
  // Add click event listeners to search icons
  document.querySelectorAll('.search-icon').forEach((icon, index) => {
    icon.addEventListener('click', function () {
      const dataIndex = parseInt(this.getAttribute('data-index'));
      toggleSearch(dataIndex);
    });
  });

  // Add input event listeners to search inputs
  document.querySelectorAll('.search-input').forEach((input, index) => {
    input.addEventListener('input', function () {
      const dataIndex = parseInt(this.getAttribute('data-index'));
      filterTable(dataIndex);
    });
  });

  // Add click event listeners to sort icons
  document.querySelectorAll('.sort-icon').forEach((icon, index) => {
    icon.addEventListener('click', function () {
      const dataIndex = parseInt(this.getAttribute('data-index'));
      sortTable(dataIndex);
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

  // Animation for table rows on load
  const rows = document.querySelectorAll('#tutorTable tbody tr');
  rows.forEach((row, index) => {
    row.style.opacity = '0';
    setTimeout(() => {
      row.style.animation = `fadeIn 0.5s ease-in-out forwards ${index * 0.05}s`;
    }, 100);
  });

  // Export button event listener
  document.getElementById('exportBtn').addEventListener('click', function () {
    exportTableToTextFile();
  });

  // Delete tutor buttons
  document.querySelectorAll('.delete-tutor').forEach(btn => {
    btn.addEventListener('click', async event => {
      const row = event.target.closest('tr');
      const tutorId = row?.dataset?.id;
      const tutorName = row?.children?.[0]?.textContent || 'this tutor';

      if (!tutorId) return;

      const confirmDelete = window.confirm(`Delete ${tutorName}? This cannot be undone.`);
      if (!confirmDelete) return;

      try {
        const res = await fetch('/api/tutors/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: tutorId }),
        });

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new Error(errorBody.error || 'Failed to delete tutor');
        }

        row.remove();
      } catch (error) {
        console.error('Delete tutor error:', error);
        alert('Error deleting tutor. Please try again.');
      }
    });
  });

  // Edit tutor modal logic
  const editModal = document.getElementById('editModal');
  const editFields = {
    id: document.getElementById('edit-id'),
    first: document.getElementById('edit-first'),
    last: document.getElementById('edit-last'),
    tutorId: document.getElementById('edit-tutorid'),
    grade: document.getElementById('edit-grade'),
    email: document.getElementById('edit-email'),
    lunch: document.getElementById('edit-lunch'),
    returning: document.getElementById('edit-returning'),
    leader: document.getElementById('edit-leader'),
    classes: document.getElementById('edit-classes'),
    days: document.getElementById('edit-days'),
    attendance: document.getElementById('edit-attendance'),
  };

  const openEditModal = row => {
    if (!row || !editModal) return;
    editFields.id.value = row.dataset.id || '';
    editFields.first.value = row.dataset.firstName || '';
    editFields.last.value = row.dataset.lastName || '';
    editFields.tutorId.value = row.dataset.tutorId || '';
    editFields.grade.value = row.dataset.grade || '';
    editFields.email.value = row.dataset.email || '';
    editFields.lunch.value = row.dataset.lunch || '';
    editFields.returning.value = String(row.dataset.returning || 'false');
    editFields.leader.value = String(row.dataset.leader || 'false');
    editFields.classes.value = row.dataset.classes || '';
    editFields.days.value = row.dataset.days || '';
    editFields.attendance.value = row.dataset.attendance || '';
    editModal.classList.remove('hidden');
    editModal.setAttribute('aria-hidden', 'false');
  };

  const closeEditModal = () => {
    if (!editModal) return;
    editModal.classList.add('hidden');
    editModal.setAttribute('aria-hidden', 'true');
  };

  document.querySelectorAll('.edit-tutor').forEach(btn => {
    btn.addEventListener('click', event => {
      const row = event.target.closest('tr');
      openEditModal(row);
    });
  });

  const parseList = value =>
    value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

  const saveButton = document.getElementById('edit-save');
  const cancelButton = document.getElementById('edit-cancel');

  if (cancelButton) {
    cancelButton.addEventListener('click', () => closeEditModal());
  }

  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      const id = editFields.id.value;
      const tutorFirstName = editFields.first.value.trim();
      const tutorLastName = editFields.last.value.trim();
      const tutorID = Number(editFields.tutorId.value);
      const grade = Number(editFields.grade.value);
      const email = editFields.email.value.trim();
      const lunchPeriod = Number(editFields.lunch.value);
      const returning = editFields.returning.value === 'true';
      const tutorLeader = editFields.leader.value === 'true';
      const classes = parseList(editFields.classes.value);
      const daysAvailable = parseList(editFields.days.value);
      const attendance = Number(editFields.attendance.value || 0);

      if (!id || !tutorFirstName || !tutorLastName || Number.isNaN(tutorID) || !email || Number.isNaN(grade)) {
        alert('Please fill all required fields.');
        return;
      }

      try {
        const res = await fetch('/api/tutors/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            tutorFirstName,
            tutorLastName,
            tutorID,
            email,
            grade,
            returning,
            lunchPeriod,
            daysAvailable,
            classes,
            tutorLeader,
            attendance,
          }),
        });

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new Error(errorBody.error || 'Failed to update tutor');
        }

        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
          row.dataset.firstName = tutorFirstName;
          row.dataset.lastName = tutorLastName;
          row.dataset.tutorId = tutorID;
          row.dataset.grade = grade;
          row.dataset.email = email;
          row.dataset.lunch = lunchPeriod;
          row.dataset.returning = returning;
          row.dataset.leader = tutorLeader;
          row.dataset.classes = classes.join(', ');
          row.dataset.days = daysAvailable.join(', ');
          row.dataset.attendance = attendance;

          const cells = row.children;
          cells[0].textContent = `${tutorFirstName} ${tutorLastName}`;
          cells[1].textContent = grade;
          cells[2].textContent = tutorID;
          cells[3].textContent = email;
          cells[4].textContent = classes.join(', ');
          cells[5].textContent = daysAvailable.join(', ');
          cells[6].textContent = lunchPeriod;
        }

        closeEditModal();
      } catch (error) {
        console.error('Update tutor error:', error);
        alert('Error updating tutor. Please try again.');
      }
    });
  }
});

function filterTable(column) {
  const input = document.getElementById(`searchInput${column}`).value.toLowerCase();
  const table = document.getElementById('tutorTable');
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
  const table = document.getElementById('tutorTable');
  let rows = Array.from(table.getElementsByTagName('tr')).slice(1);
  const isNumeric = column === 6 || column === 2;

  const reverse = currentSort.columnIndex === column ? !currentSort.isDescending : false;
  rows.sort((rowA, rowB) => {
    let cellA = rowA.getElementsByTagName('td')[column].textContent.trim();
    let cellB = rowB.getElementsByTagName('td')[column].textContent.trim();

    if (isNumeric) {
      return reverse ? cellB - cellA : cellA - cellB;
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

function exportTableToTextFile() {
  const table = document.getElementById('tutorTable');
  const headers = Array.from(table.querySelectorAll('thead th')).map(th =>
    th.querySelector('.header-text').textContent.trim()
  );

  const rows = Array.from(table.querySelectorAll('tbody tr'))
    .filter(row => row.style.display !== 'none')
    .map(row => {
      return Array.from(row.cells)
        .map(cell => cell.textContent.trim())
        .join('\t');
    });

  // Create text content
  const content = [headers.join('\t'), ...rows].join('\n');

  // Create a blob
  const blob = new Blob([content], { type: 'text/plain' });

  // Create download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'tutors_export.txt';

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
}
