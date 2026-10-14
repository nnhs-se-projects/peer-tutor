/**
 * Client-side JS for the Admin Tutor Requests page.
 * Handles column sorting, per-column search, status filtering, and export.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Main requests table in adminTutorRequests.ejs
  const table = document.getElementById('requestsTable');
  if (!table) return;

  // We sort/filter rows inside <tbody> so header cells are never moved.
  const tbody = table.querySelector('tbody');

  // ── Column Sorting ──
  // Track current sort direction for each column index.
  // Example: { 0: 'asc', 3: 'desc' }
  const sortStates = {}; // index -> 'asc' | 'desc'

  document.querySelectorAll('.sort-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      // Each sort icon stores its target column in data-index.
      const index = parseInt(icon.dataset.index);
      const rows = Array.from(tbody.querySelectorAll('tr'));

      // Toggle sort direction
      sortStates[index] = sortStates[index] === 'asc' ? 'desc' : 'asc';
      const dir = sortStates[index];

      // Compare a cell's data-sort-value when it has one, otherwise its text.
      const sortValue = row => {
        const cell = row.cells[index];
        if (!cell) return '';
        return (cell.dataset.sortValue ?? cell.textContent).trim().toLowerCase();
      };

      rows.sort((a, b) => {
        const aText = sortValue(a);
        const bText = sortValue(b);
        return dir === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
      });

      // Re-append rows in sorted order.
      rows.forEach(row => tbody.appendChild(row));
      icon.textContent = dir === 'asc' ? '↑' : '↓';
    });
  });

  // ── Per-Column Search ──
  document.querySelectorAll('.search-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      const index = icon.dataset.index;
      const input = document.getElementById('searchInput' + index);
      if (input) {
        input.style.display = input.style.display === 'none' ? 'block' : 'none';
        if (input.style.display === 'block') input.focus();
      }
    });
  });

  document.querySelectorAll('.search-input').forEach(input => {
    // Re-run filtering on every keystroke for immediate feedback.
    input.addEventListener('input', applyFilters);
  });

  // ── Status Filter Buttons ──
  // Current status tab selected by the user (All, Pending, etc.).
  let activeStatusFilter = 'all';

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatusFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  function applyFilters() {
    // Applies BOTH status filter and per-column text filters.
    // A row must pass all active conditions to remain visible.
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const searchInputs = document.querySelectorAll('.search-input');

    rows.forEach(row => {
      // Status filter
      const rowStatus = row.dataset.status || '';
      const statusMatch = activeStatusFilter === 'all' || rowStatus === activeStatusFilter;

      // Column search filters
      let searchMatch = true;
      searchInputs.forEach(input => {
        // data-index ties this search input to its table column.
        const colIndex = parseInt(input.dataset.index);
        const query = input.value.trim().toLowerCase();
        if (query) {
          const cellText = (row.cells[colIndex]?.textContent || '').trim().toLowerCase();
          if (!cellText.includes(query)) {
            searchMatch = false;
          }
        }
      });

      row.style.display = statusMatch && searchMatch ? '' : 'none';
    });
  }

  // ── Export Buttons ──
  window.TableExport.bindExportButtons({
    tableId: 'requestsTable',
    baseName: 'tutor-requests-export',
    sheetName: 'Tutor Requests',
  });
});
