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

// NEWWWWWWWWWWWWWWW

document.addEventListener("DOMContentLoaded", () => {
  // Add event listeners to all buttons
  document.querySelectorAll(".absent-button").forEach((button) => {
    button.addEventListener("click", () => {
      const tutorId = button.dataset.id; // Get the tutor's ID
      console.log(`Absent button clicked for tutor ID: ${tutorId}`); // Debug log
      updateAttendance(tutorId, 1); // Increase attendance by 1
    });
  });
});

// Function to update attendance
async function updateAttendance(tutorId, change) {
  try {
    const response = await fetch(`/updateAttendance/${tutorId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ change }),
    });

    if (response.ok) {
      const updatedData = await response.json();
      // Update the attendance value in the table dynamically
      const attendanceCell = document.getElementById(`attendance-${tutorId}`);
      if (attendanceCell) {
        attendanceCell.textContent = updatedData.attendance; // Update the displayed value
      }
    } else {
      console.error("Failed to update attendance");
    }
  } catch (error) {
    console.error("Error updating attendance:", error);
  }
}
