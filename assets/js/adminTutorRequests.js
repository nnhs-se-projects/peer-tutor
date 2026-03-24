/**
 * Client-side JS for the Admin Tutor Requests page.
 * Handles column sorting, per-column search, status filtering, and export.
 */
document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('requestsTable');
  if (!table) return;

  const tbody = table.querySelector('tbody');

  // ── Column Sorting ──
  const sortStates = {}; // index -> 'asc' | 'desc'

  document.querySelectorAll('.sort-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      const index = parseInt(icon.dataset.index);
      const rows = Array.from(tbody.querySelectorAll('tr'));

      // Toggle sort direction
      sortStates[index] = sortStates[index] === 'asc' ? 'desc' : 'asc';
      const dir = sortStates[index];

      rows.sort((a, b) => {
        const aText = (a.cells[index]?.textContent || '').trim().toLowerCase();
        const bText = (b.cells[index]?.textContent || '').trim().toLowerCase();
        return dir === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
      });

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
    input.addEventListener('input', applyFilters);
  });

  // ── Status Filter Buttons ──
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
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const searchInputs = document.querySelectorAll('.search-input');

    rows.forEach(row => {
      // Status filter
      const rowStatus = row.dataset.status || '';
      const statusMatch = activeStatusFilter === 'all' || rowStatus === activeStatusFilter;

      // Column search filters
      let searchMatch = true;
      searchInputs.forEach(input => {
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
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (!window.TableExport) return;

      window.TableExport.exportTableToTextFile({
        tableId: 'requestsTable',
        fileName: 'tutor_requests.txt',
      });
    });
  }

  const exportSpreadsheetBtn = document.getElementById('exportSpreadsheetBtn');
  if (exportSpreadsheetBtn) {
    exportSpreadsheetBtn.addEventListener('click', async () => {
      if (!window.TableExport) return;

      try {
        await window.TableExport.exportTableToSpreadsheet({
          tableId: 'requestsTable',
          fileName: 'tutor_requests_export.xlsx',
          sheetName: 'Tutor Requests',
        });
      } catch (error) {
        console.error('Spreadsheet export failed:', error);
        alert('Unable to export spreadsheet right now. Please try again.');
      }
    });
  }
});
