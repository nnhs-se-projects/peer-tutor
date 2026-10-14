document.addEventListener('DOMContentLoaded', function () {
  // Grade, lunch, total sessions, and absences sort as numbers
  window.TableTools.init({ tableId: 'tutorTable', numericColumns: [1, 6, 7, 8] });

  window.TableExport.bindExportButtons({
    tableId: 'tutorTable',
    baseName: 'tutors-export',
    sheetName: 'Tutors',
  });

  // Delete tutor buttons (only shown to admins)
  document.querySelectorAll('.delete-tutor').forEach(btn => {
    btn.addEventListener('click', async event => {
      const row = event.target.closest('tr');
      const tutorId = row?.dataset?.id;
      const tutorName = row?.children?.[0]?.textContent.trim() || 'this tutor';

      if (!tutorId) return;

      const confirmDelete = window.confirm(`Delete ${tutorName}? This cannot be undone.`);
      if (!confirmDelete) return;

      try {
        const res = await fetch('/api/tutors/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: tutorId }),
        });

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new Error(errorBody.error || 'Failed to delete tutor');
        }

        row.remove();
      } catch (error) {
        console.error('Delete tutor error:', error);
        alert(`Error deleting tutor: ${error.message}`);
      }
    });
  });
});
