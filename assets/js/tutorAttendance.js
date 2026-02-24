document
  .getElementById("idForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const tutorID = document.getElementById("tutorID").value;

    try {
      const response = await fetch(`/api/tutor-attendance/${tutorID}`);
      if (!response.ok) {
        throw new Error("Tutor not found");
      }

      const data = await response.json();

      // Show the table
      document.getElementById("tutorInfo").style.display = "block";

      // Populate basic info
      document.getElementById("tutorName").textContent = data.name;
      document.getElementById("daysMissed").textContent = data.daysMissed;
      document.getElementById("sessionCount").textContent = data.sessionCount;

      // Populate session history
      const sessionTableBody = document
        .getElementById("sessionHistory")
        .getElementsByTagName("tbody")[0];
      sessionTableBody.innerHTML = ""; // Clear existing rows

      data.sessions.forEach((session) => {
        const row = sessionTableBody.insertRow();
        row.insertCell(0).textContent = new Date(
          session.date
        ).toLocaleDateString();
        row.insertCell(1).textContent = session.subject;
        row.insertCell(2).textContent = session.student;
        row.insertCell(3).textContent = session.duration;
      });
    } catch (error) {
      alert("Error: " + error.message);
    }
  });
