document.addEventListener('DOMContentLoaded', function () {
  // Password protection popup for Teacher
  const password = prompt('Enter teacher password to access this page:');
  if (password !== 'teacher') {
    alert('Incorrect password. Redirecting to homepage.');
    window.location.href = '/';
    return;
  }
});

function sortTable(columnIndex, ascending) {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById('studentTable');
  switching = true;
  while (switching) {
    switching = false;
    rows = table.rows;
    for (i = 1; i < rows.length - 1; i++) {
      shouldSwitch = false;
      x = rows[i].getElementsByTagName('TD')[columnIndex];
      y = rows[i + 1].getElementsByTagName('TD')[columnIndex];
      if (ascending) {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          shouldSwitch = true;
          break;
        }
      } else {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          shouldSwitch = true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}
