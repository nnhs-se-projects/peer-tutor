let currentSort = {};

function sortTable(columnIndex) {
  const table = document.getElementById("studentTable");
  const rows = Array.from(table.rows).slice(1); // Get rows excluding header
  const isNumeric = columnIndex === 6 || columnIndex === 2; // Numerical columns
  const reverse =
    currentSort.columnIndex === columnIndex && !currentSort.isDescending;

  // Sort the rows based on the column clicked
  rows.sort((rowA, rowB) => {
    const cellA = rowA.cells[columnIndex].innerText;
    const cellB = rowB.cells[columnIndex].innerText;

    let valueA = isNumeric ? parseFloat(cellA) : cellA.toLowerCase();
    let valueB = isNumeric ? parseFloat(cellB) : cellB.toLowerCase();

    if (valueA > valueB) return reverse ? -1 : 1;
    if (valueA < valueB) return reverse ? 1 : -1;
    return 0;
  });

  // Reorder the rows in the table
  rows.forEach((row) => table.appendChild(row));

  // Update sorting state and icon
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
  icon.textContent = isDescending ? "↓↑" : "↑↓";
}
