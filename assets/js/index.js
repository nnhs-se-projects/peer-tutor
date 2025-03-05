document.addEventListener("DOMContentLoaded", function () {
  // Check if the user has seen the pop-up in this session
  if (!sessionStorage.getItem("welcomePopupShown")) {
    // Show the pop-up
    var popup = document.getElementById("welcomePopup");
    popup.style.display = "block";

    // Set a session storage item to remember that the user has seen the pop-up
    sessionStorage.setItem("welcomePopupShown", "true");

    // Get the <span> element that closes the pop-up
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the pop-up
    span.onclick = function () {
      popup.style.display = "none";
    };

    // When the user clicks anywhere outside of the pop-up, close it
    window.onclick = function (event) {
      if (event.target == popup) {
        popup.style.display = "none";
      }
    };
  }
});
