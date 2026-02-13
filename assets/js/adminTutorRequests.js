/**
 * Client-side JS for the Admin Tutor Requests page.
 * Handles column sorting, per-column search, status filtering, and export.
 */
document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('requestsTable');
  if (!table) return;

  const tbody = table.querySelector('tbody');
  const headers = table.querySelectorAll('thead th');

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

  // ── Export to Text File ──
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const rows = Array.from(tbody.querySelectorAll('tr')).filter(r => r.style.display !== 'none');

      const headerTexts = Array.from(headers).map(
        th => th.querySelector('.header-text')?.textContent?.trim() || ''
      );

      let text = headerTexts.join('\t') + '\n';
      rows.forEach(row => {
        const cells = Array.from(row.cells).map(c => c.textContent.trim());
        text += cells.join('\t') + '\n';
      });

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tutor_requests.txt';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
});

