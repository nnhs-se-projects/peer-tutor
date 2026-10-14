document.addEventListener('DOMContentLoaded', function () {
  // Show the most recent sessions logged by any tutor
  function loadRecentSessions() {
    const sessionHistory = document.getElementById('sessionHistory');
    if (!sessionHistory) return;
    // Show loading state
    sessionHistory.innerHTML = '<div class="text-center"><p>Loading sessions...</p></div>';
    fetch('/api/sessions/recent')
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
        // Display sessions
        let html = '<div class="space-y-4">';
        sessions.forEach(session => {
          html += `
            <div class="border rounded-lg p-4 hover:bg-gray-50">
              <div class="font-bold">${escapeHtml(session.department)} - ${escapeHtml(session.class)}</div>
              <div class="text-sm text-gray-600">Date: ${escapeHtml(session.date)}</div>
              <div class="text-sm text-gray-600">Tutor: ${escapeHtml(session.tutorName)}</div>
              <div class="text-sm text-gray-600">Tutee: ${escapeHtml(session.tuteeName)}</div>
              <div class="text-sm text-gray-600">Focus: ${escapeHtml(session.focusOfSession)}</div>
              <div class="text-sm text-gray-600">Work Accomplished: ${escapeHtml(session.workAccomplished)}</div>
            </div>
          `;
        });
        html += '</div>';
        sessionHistory.innerHTML = html;
      })
      .catch(error => {
        console.error('Error loading sessions:', error);
        sessionHistory.innerHTML =
          '<div class="text-red-500">Error loading sessions. Please try again.</div>';
      });
  }
  loadRecentSessions();
});
