document.addEventListener('DOMContentLoaded', function () {
  // The date column sorts by the ISO date stored in data-sort-value
  window.TableTools.init({ tableId: 'sessionTable' });

  window.TableExport.bindExportButtons({
    tableId: 'sessionTable',
    baseName: 'sessions-export',
    sheetName: 'Sessions',
  });
});
