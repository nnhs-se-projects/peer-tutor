/**
 * Shared table export helpers.
 * Supports plain text (.txt) and formatted spreadsheet (.xlsx) exports.
 */
(function () {
  function normalizeText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getHeaderText(th) {
    const label = th.querySelector('.header-text');
    if (label) return normalizeText(label.textContent);

    const clone = th.cloneNode(true);
    clone
      .querySelectorAll('.sort-icon, .search-icon, .search-input, .icons')
      .forEach(el => el.remove());
    return normalizeText(clone.textContent);
  }

  function getCellText(cell) {
    return normalizeText(cell.textContent);
  }

  function isRowVisible(row) {
    return row.style.display !== 'none';
  }

  function buildTableMatrix({ tableId, includeHiddenRows = false, rowMapper = null }) {
    const table = document.getElementById(tableId);
    if (!table) {
      throw new Error(`Table with id "${tableId}" was not found.`);
    }

    const headers = Array.from(table.querySelectorAll('thead th')).map(getHeaderText);

    const rows = Array.from(table.querySelectorAll('tbody tr'))
      .filter(row => includeHiddenRows || isRowVisible(row))
      .map(row => {
        if (typeof rowMapper === 'function') {
          return rowMapper(row);
        }

        return Array.from(row.cells).map(getCellText);
      })
      .filter(row => Array.isArray(row) && row.length > 0);

    return { headers, rows };
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportTableToTextFile({ tableId, fileName, rowMapper = null }) {
    const { headers, rows } = buildTableMatrix({ tableId, rowMapper });
    const content = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    downloadBlob(blob, fileName);
  }

  function applyWorksheetStyle(worksheet, columnCount) {
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFB0BEC5' } },
          left: { style: 'thin', color: { argb: 'FFB0BEC5' } },
          bottom: { style: 'thin', color: { argb: 'FFB0BEC5' } },
          right: { style: 'thin', color: { argb: 'FFB0BEC5' } },
        };
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
      });

      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F8FD' },
          };
        });
      }
    });

    const widths = [];
    for (let i = 1; i <= columnCount; i += 1) {
      let maxLength = 10;
      worksheet.eachRow(row => {
        const cellValue = row.getCell(i).value;
        const text = normalizeText(cellValue);
        maxLength = Math.max(maxLength, text.length + 2);
      });
      widths.push({ width: Math.min(45, maxLength) });
    }
    worksheet.columns = widths;

    if (columnCount > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columnCount },
      };
    }
  }

  function addStyledWorksheet(workbook, { sheetName, headers, rows }) {
    const worksheet = workbook.addWorksheet(sheetName || 'Sheet1');
    worksheet.addRow(headers);
    rows.forEach(row => worksheet.addRow(row));
    applyWorksheetStyle(worksheet, headers.length);
    return worksheet;
  }

  async function exportTablesToSpreadsheet({ fileName, sheets }) {
    if (!window.ExcelJS) {
      throw new Error('Spreadsheet library is unavailable. Reload and try again.');
    }

    const workbook = new window.ExcelJS.Workbook();

    sheets.forEach(sheet => {
      addStyledWorksheet(workbook, {
        sheetName: sheet.sheetName,
        headers: sheet.headers,
        rows: sheet.rows,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadBlob(blob, fileName);
  }

  async function exportTableToSpreadsheet({ tableId, fileName, sheetName, rowMapper = null }) {
    const matrix = buildTableMatrix({ tableId, rowMapper });
    await exportTablesToSpreadsheet({
      fileName,
      sheets: [{ sheetName: sheetName || 'Sheet1', headers: matrix.headers, rows: matrix.rows }],
    });
  }

  window.TableExport = {
    buildTableMatrix,
    exportTableToTextFile,
    exportTableToSpreadsheet,
    exportTablesToSpreadsheet,
  };
})();
