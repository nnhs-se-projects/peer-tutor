document.addEventListener('DOMContentLoaded', function () {
  const popup = document.getElementById('welcomePopup');
  const closeButton = document.querySelector('.popup .close');

  // Show the pop-up when the page loads
  if (popup) {
    popup.style.display = 'block';
  }

  // Close the pop-up when the close button is clicked
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      popup.style.display = 'none';
    });
  }
});