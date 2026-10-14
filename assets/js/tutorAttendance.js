/**
 * Tutor attendance page: look up a tutor's days missed and session history by ID.
 */

document.addEventListener('DOMContentLoaded', () => {
  const idForm = document.getElementById('idForm');
  const tutorIdInput = document.getElementById('tutorID');

  async function showTutor(tutorID) {
    try {
      const response = await fetch(`/api/tutor-attendance/${encodeURIComponent(tutorID)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Tutor not found');
      }

      // Show the table
      document.getElementById('tutorInfo').style.display = 'block';

      // Populate basic info
      document.getElementById('tutorName').textContent = data.name;
      document.getElementById('daysMissed').textContent = data.daysMissed;
      document.getElementById('sessionCount').textContent = data.sessionCount;

      // Populate session history (dates come from the server already formatted)
      const sessionTableBody = document.querySelector('#sessionHistory tbody');
      sessionTableBody.innerHTML = '';
      data.sessions.forEach(session => {
        const row = sessionTableBody.insertRow();
        row.insertCell(0).textContent = session.date;
        row.insertCell(1).textContent = session.department;
        row.insertCell(2).textContent = session.student;
        row.insertCell(3).textContent = session.period;
      });
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  idForm.addEventListener('submit', event => {
    event.preventDefault();
    showTutor(tutorIdInput.value.trim());
  });

  // Tutors see their own information right away
  if (tutorIdInput.value) {
    showTutor(tutorIdInput.value);
  }
});
