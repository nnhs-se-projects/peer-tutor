document.addEventListener('DOMContentLoaded', function () {
  // Password protection popup for Tutor Leader
  const password = prompt('Enter tutor leader password to access this page:');
  if (password !== 'lead') {
    alert('Incorrect password. Redirecting to homepage.');
    window.location.href = '/';
    return;
  }
  // Additional tutor leader page logic can go here
});
