document.addEventListener('DOMContentLoaded', function () {
  // Role-based access is now handled by server middleware via Google OAuth
  // No password needed - user role is verified on the server

  // Load session history for admin
  function loadSessionHistory() {
    const sessionHistory = document.getElementById('sessionHistory');
    if (!sessionHistory) return;
    // Show loading state
    sessionHistory.innerHTML = '<div class="text-center"><p>Loading your sessions...</p></div>';
    // Fetch session history for admin (reuse student endpoint or create admin-specific if needed)
    fetch('/api/student/sessions')
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
          const sessionDate = new Date(session.sessionDate).toLocaleDateString();
          html += `
            <div class="border rounded-lg p-4 hover:bg-gray-50">
              <div class="font-bold">${session.subject} - ${session.class}</div>
              <div class="text-sm text-gray-600">Date: ${sessionDate}</div>
              <div class="text-sm text-gray-600">Tutor: ${session.tutorFirstName} ${session.tutorLastName}</div>
              <div class="text-sm text-gray-600">Focus: ${session.FocusOfSession || ''}</div>
              <div class="text-sm text-gray-600">Work Accomplished: ${session.workaccomplished || ''}</div>
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
  loadSessionHistory();
});
