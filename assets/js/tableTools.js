/**
 * Sorting and per-column search for the data tables (tutor, session, and attendance tables).
 *
 * Each sortable/searchable header cell has a `.header-text` (id `headerText<index>`) followed by
 * an `.icons` wrapper with a `.sort-icon` (id `sortIcon<index>`) and a `.search-icon`, plus a
 * `.search-input` (id `searchInput<index>`). Icons and inputs carry their column in data-index.
 * A cell's data-sort-value, when present, is used for sorting instead of its text.
 */
window.TableTools = (function () {
  /**
   * @param {Object} options
   * @param {string} options.tableId
   * @param {number[]} [options.numericColumns] - columns sorted as numbers
   * @param {(row: HTMLTableRowElement) => boolean} [options.rowFilter] - extra filter applied
   *   together with the column searches
   * @returns {{applyFilters: Function}|null}
   */
  function init({ tableId, numericColumns = [], rowFilter = null }) {
    const table = document.getElementById(tableId);
    if (!table) return null;

    const tbody = table.tBodies[0];
    const searchInputs = Array.from(table.querySelectorAll('.search-input'));
    let sortState = { column: null, descending: false };

    const headerTextFor = index => table.querySelector(`#headerText${index}`);
    const searchInputFor = index => table.querySelector(`#searchInput${index}`);

    // Show a row only if it passes the row filter and every column search
    function applyFilters() {
      Array.from(tbody.rows).forEach(row => {
        const matchesSearch = searchInputs.every(input => {
          const query = input.value.trim().toLowerCase();
          const cell = row.cells[Number(input.dataset.index)];
          return !query || !cell || cell.textContent.toLowerCase().includes(query);
        });
        const visible = matchesSearch && (!rowFilter || rowFilter(row));
        row.style.display = visible ? '' : 'none';
      });
    }

    function sortBy(column) {
      const descending = sortState.column === column ? !sortState.descending : false;
      const numeric = numericColumns.includes(column);

      const sortValue = row => {
        const cell = row.cells[column];
        if (!cell) return '';
        return cell.dataset.sortValue !== undefined ? cell.dataset.sortValue : cell.textContent.trim();
      };

      const rows = Array.from(tbody.rows);
      rows.sort((rowA, rowB) => {
        const a = sortValue(rowA);
        const b = sortValue(rowB);
        const result = numeric
          ? (parseFloat(a) || 0) - (parseFloat(b) || 0)
          : a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        return descending ? -result : result;
      });
      rows.forEach(row => tbody.appendChild(row));

      sortState = { column, descending };
      table.querySelectorAll('.sort-icon').forEach(icon => {
        icon.textContent = '↑↓';
      });
      const icon = table.querySelector(`#sortIcon${column}`);
      if (icon) icon.textContent = descending ? '↓' : '↑';
    }

    function hideSearch(index) {
      const headerText = headerTextFor(index);
      const input = searchInputFor(index);
      if (!headerText || !input) return;

      input.style.display = 'none';
      headerText.style.display = 'block';
      headerText.nextElementSibling.style.display = 'flex';
    }

    function toggleSearch(index) {
      const headerText = headerTextFor(index);
      const input = searchInputFor(index);
      if (!headerText || !input) return;

      const icons = headerText.nextElementSibling;
      if (input.style.display === 'none' || input.style.display === '') {
        // Size the search box to fill the space the header text and icons were using
        input.style.height = `${headerText.offsetHeight + 5}px`;
        input.style.width = `${headerText.offsetWidth + icons.offsetWidth + 100}px`;
        headerText.style.display = 'none';
        icons.style.display = 'none';
        input.style.display = 'inline-block';
        input.focus();
      } else if (input.value === '') {
        hideSearch(index);
      }
    }

    table.querySelectorAll('.sort-icon').forEach(icon => {
      icon.addEventListener('click', () => sortBy(Number(icon.dataset.index)));
    });
    table.querySelectorAll('.search-icon').forEach(icon => {
      icon.addEventListener('click', () => toggleSearch(Number(icon.dataset.index)));
    });
    searchInputs.forEach(input => input.addEventListener('input', applyFilters));

    // Clicking elsewhere closes empty search boxes
    document.addEventListener('click', event => {
      searchInputs.forEach(input => {
        const icon = table.querySelector(`.search-icon[data-index="${input.dataset.index}"]`);
        const clickedSearch = input.contains(event.target) || (icon && icon.contains(event.target));
        if (input.value === '' && !clickedSearch) {
          hideSearch(input.dataset.index);
        }
      });
    });

    // Fade the rows in on load
    Array.from(tbody.rows).forEach((row, index) => {
      row.style.opacity = '0';
      setTimeout(() => {
        row.style.animation = `fadeIn 0.5s ease-in-out forwards ${index * 0.05}s`;
      }, 100);
    });

    applyFilters();
    return { applyFilters };
  }

  return { init };
})();
