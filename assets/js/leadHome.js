document.addEventListener('DOMContentLoaded', function () {
  // Role-based access is now handled by server middleware via Google OAuth
  // No password needed - user role is verified on the server

  // Confirm the attendance submission, then clean up its URL params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('fromAttendance') === 'true') {
    const savedMessage = document.getElementById('attendanceSavedMessage');
    savedMessage.textContent = `✅ Attendance saved for Period ${urlParams.get('lunch')}.`;
    savedMessage.classList.remove('hidden');
    window.history.replaceState({}, document.title, '/leadHome');
  }

  // Additional tutor leader page logic can go here
});
