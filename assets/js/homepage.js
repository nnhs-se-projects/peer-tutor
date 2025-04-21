document.addEventListener('DOMContentLoaded', function () {
  const popup = document.getElementById('welcomePopup');
  const closeButton = document.querySelector('.popup .close');

  // Show the pop-up when the page loads
  if (popup) {
    popup.style.display = 'block';
  }

  // Close the pop-up when the close button is clicked
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      popup.style.display = 'none';
    });
  }
});

function toggleSearch(column) {
  const headerText = document.getElementById(`headerText${column}`);
  const searchInput = document.getElementById(`searchInput${column}`);
  const icons = headerText.nextElementSibling;

  if (searchInput.style.display === 'none' || searchInput.style.display === '') {
    headerText.style.display = 'none';
    searchInput.style.display = 'inline-block';
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

function filterTable(column) {
  const input = document.getElementById(`searchInput${column}`).value.toLowerCase();
  const table = document.getElementById('leaderboardTable');
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
  const table = document.getElementById('leaderboardTable');
  let rows = Array.from(table.getElementsByTagName('tr')).slice(1);
  const isNumeric = column === 0 || column === 3;

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

// Attach event listeners for sorting and searching
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.search-icon').forEach((icon, index) => {
    icon.addEventListener('click', () => toggleSearch(index));
  });

  document.querySelectorAll('.sort-icon').forEach((icon, index) => {
    icon.addEventListener('click', () => sortTable(index));
  });

  document.querySelectorAll('.search-input').forEach((input, index) => {
    input.addEventListener('input', () => filterTable(index));
  });
});

/**
 * Homepage animations and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Animation for table rows on scroll
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const row = entry.target;
          row.classList.add('animate-row');
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('tr').forEach(row => {
    observer.observe(row);
  });

  // Handle podium hover effects
  const podiumItems = document.querySelectorAll('.podium-item');
  podiumItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.classList.add('scale-105');
    });
    item.addEventListener('mouseleave', () => {
      item.classList.remove('scale-105');
    });
  });
});
