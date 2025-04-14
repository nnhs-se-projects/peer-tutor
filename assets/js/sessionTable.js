function toggleSearch(column) {
  const headerText = document.getElementById(`headerText${column}`);
  const searchInput = document.getElementById(`searchInput${column}`);
  const icons = headerText.nextElementSibling;

  // Calculate the width of the header and apply it to the search input
  const headerHeight = headerText.offsetHeight + 5;
  const headerWidth = headerText.offsetWidth + icons.offsetWidth + 100;

  if (
    searchInput.style.display === "none" ||
    searchInput.style.display === ""
  ) {
    headerText.style.display = "none";
    searchInput.style.display = "inline-block";
    searchInput.style.height = `${headerHeight}px`;
    searchInput.style.width = `${headerWidth}px`;

    icons.style.display = "none";
    searchInput.focus();
  } else {
    if (searchInput.value === "") {
      headerText.style.display = "block";
      searchInput.style.display = "none";
      icons.style.display = "flex";
    }
  }
}

// search function for date
function toggleSearchDropdown(column) {
  const headerText = document.getElementById(`headerText${column}`);
  const dropdownMenu = document.getElementById(`dropdownMenu${column}`);
  const searchInput = dropdownMenu.querySelector("input");
  const icons = headerText.nextElementSibling;

  if (
    dropdownMenu.style.display === "none" ||
    dropdownMenu.style.display === ""
  ) {
    // Show dropdown
    dropdownMenu.style.display = "block";
    icons.style.display = "none";
    searchInput.focus();
  } else {
    // Hide dropdown if already open
    dropdownMenu.style.display = "none";
    icons.style.display = "flex";
  }
}

// Function to filter dropdown options
function filterDropdownOptions(column) {
  const searchInput = document.getElementById(`searchInput${column}`);
  const filter = searchInput.value.toLowerCase();
  const options = document.querySelectorAll(
    `#dropdownMenu${column} .dropdown-item`
  );

  options.forEach((option) => {
    if (option.textContent.toLowerCase().includes(filter)) {
      option.style.display = "block";
    } else {
      option.style.display = "none";
    }
  });
}

// Function to select an option and close dropdown
function selectDropdownOption(column, value) {
  const headerText = document.getElementById(`headerText${column}`);
  const dropdownMenu = document.getElementById(`dropdownMenu${column}`);
  const icons = headerText.nextElementSibling;

  headerText.textContent = value;
  dropdownMenu.style.display = "none";
  icons.style.display = "flex";
}

document.addEventListener("click", function (event) {
  document.querySelectorAll(".search-input").forEach((input, index) => {
    if (
      !input.contains(event.target) &&
      !document
        .querySelector(`.search-icon[onclick='toggleSearch(${index})']`)
        .contains(event.target)
    ) {
      if (input.value === "") {
        input.style.display = "none";
        document.getElementById(`headerText${index}`).style.display = "block";
        document.getElementById(
          `headerText${index}`
        ).nextElementSibling.style.display = "flex";
      }
    }
  });
});

function filterTable(column) {
  const input = document
    .getElementById(`searchInput${column}`)
    .value.toLowerCase();
  const table = document.getElementById("studentTable");
  const rows = table.getElementsByTagName("tr");

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    if (cells[column]) {
      const cellText = cells[column].textContent || cells[column].innerText;
      rows[i].style.display = cellText.toLowerCase().includes(input)
        ? ""
        : "none";
    }
  }
}

let currentSort = { columnIndex: null, isDescending: false };

function sortTable(column) {
  const table = document.getElementById("studentTable");
  let rows = Array.from(table.getElementsByTagName("tr")).slice(1);
  const isNumeric = column === 6 || column === 2;

  const reverse =
    currentSort.columnIndex === column ? !currentSort.isDescending : false;
  rows.sort((rowA, rowB) => {
    let cellA = rowA.getElementsByTagName("td")[column].textContent.trim();
    let cellB = rowB.getElementsByTagName("td")[column].textContent.trim();

    if (isNumeric) {
      return reverse ? cellB - cellA : cellA - cellB;
    } else {
      return reverse ? cellB.localeCompare(cellA) : cellA.localeCompare(cellB);
    }
  });

  rows.forEach((row) => table.appendChild(row));

  currentSort = { columnIndex: column, isDescending: reverse };
  updateSortIcons(column, reverse);
}

function updateSortIcons(column, isDescending) {
  document.querySelectorAll(".sort-icon").forEach((icon) => {
    icon.textContent = "↑↓";
  });

  const icon = document.getElementById(`sortIcon${column}`);
  icon.textContent = isDescending ? "↓" : "↑";
}

absen;
