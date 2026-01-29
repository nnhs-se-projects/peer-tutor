document.addEventListener('DOMContentLoaded', function () {
  // Check if returning from attendance submission (bypass password)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('fromAttendance') === 'true') {
    // Clean up the URL without reloading the page
    window.history.replaceState({}, document.title, '/leadHome');
    return;
  }

  // Password protection popup for Tutor Leader
  const password = prompt('Enter tutor leader password to access this page:');
  if (password !== 'lead') {
    alert('Incorrect password. Redirecting to homepage.');
    window.location.href = '/';
    return;
  }
  // Additional tutor leader page logic can go here
});

