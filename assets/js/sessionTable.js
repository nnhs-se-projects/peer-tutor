let currentSort = { columnIndex: null, isDescending: false };

function sortTable(columnIndex) {
  const table = document.getElementById("studentTable");
  const rows = Array.from(table.rows).slice(1); // Get rows excluding header
  const isNumeric = columnIndex === 6 || columnIndex === 2; // Numerical columns
  const isDateColumn = columnIndex === 0;

  // Determine the sort order
  const reverse =
    currentSort.columnIndex === columnIndex ? !currentSort.isDescending : false;

  // Sort the rows based on the column clicked
  rows.sort((a, b) => {
    let cellA = a.cells[columnIndex].innerText;
    let cellB = b.cells[columnIndex].innerText;

    if (isDateColumn) {
      // Date column sorting
      const dateA = new Date(cellA);
      const dateB = new Date(cellB);
      return reverse ? dateB - dateA : dateA - dateB;
    } else if (isNumeric) {
      // Numeric column sorting
      return reverse ? cellB - cellA : cellA - cellB;
    } else {
      return reverse ? cellB.localeCompare(cellA) : cellA.localeCompare(cellB);
    }
  });

  // Append sorted rows back to the table
  rows.forEach((row) => table.appendChild(row));

  // Update sorting state
  currentSort = { columnIndex, isDescending: reverse };
  updateSortIcons(columnIndex, reverse);
}

function updateSortIcons(columnIndex, isDescending) {
  // Reset all sort icons
  const headers = document.querySelectorAll("th");
  headers.forEach((header) => {
    header.querySelector(".sort-icon").textContent = "↑↓";
  });

  // Update the clicked column's icon
  const icon = headers[columnIndex].querySelector(".sort-icon");
  icon.textContent = isDescending ? "↓" : "↑";
}
