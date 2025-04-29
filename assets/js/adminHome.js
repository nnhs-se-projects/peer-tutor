document.addEventListener('DOMContentLoaded', function () {
  // Load session history for admin
  function loadSessionHistory() {
    const sessionHistory = document.getElementById('sessionHistory');
    if (!sessionHistory) return;
    sessionHistory.innerHTML = '<div class="text-center"><p>Loading all sessions...</p></div>';
    fetch('/api/admin/sessions')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(sessions => {
        if (sessions.length === 0) {
          sessionHistory.innerHTML =
            '<div class="text-center text-gray-500 italic">No recent sessions found.</div>';
          return;
        }
        let html = '<div class="space-y-4">';
        sessions.forEach(session => {
          const sessionDate = new Date(session.sessionDate).toLocaleDateString();
          html += `
            <div class="border rounded-lg p-4 hover:bg-gray-50">
              <div class="font-bold">${session.subject} - ${session.class}</div>
              <div>Date: ${sessionDate}</div>
              <div>Tutor: ${session.tutorFirstName} ${session.tutorLastName}</div>
              <div>Tutee: ${session.tuteeFirstName} ${session.tuteeLastName}</div>
              <div>Focus: ${session.focusOfSession || ''}</div>
              <div>Work Accomplished: ${session.workAccomplished || ''}</div>
            </div>
          `;
        });
        html += '</div>';
        sessionHistory.innerHTML = html;
      })
      .catch(error => {
        console.error('Error fetching sessions:', error);
        sessionHistory.innerHTML =
          '<div class="text-red-500">Error loading session history. Please try again.</div>';
      });
  }
  loadSessionHistory();
});
