document.addEventListener("DOMContentLoaded", () => {
   document
     .getElementById("idForm")
     .addEventListener("submit", async function (event) {
       event.preventDefault(); // Prevent the default form submission
 
       const tutorID = document.getElementById("tutorID").value;
 
       // Fetch attendance data based on the tutor ID
       try {
         const response = await fetch(`/attendance/${tutorID}`);
         if (!response.ok) {
           throw new Error("Failed to fetch attendance data");
         }
         const attendanceData = await response.json();
 
         // Display the attendance data
         displayAttendance(attendanceData);
       } catch (error) {
         console.error("Error fetching attendance data:", error);
         alert("There was an error fetching the attendance data.");
       }
     });
 });
 
 function displayAttendance(attendanceData) {
   const attendanceDiv = document.getElementById("attendance");
   const attendanceValue = document.getElementById("attendanceValue");
   attendanceValue.textContent = `Attendance: ${attendanceData.attendance}`;
   attendanceDiv.classList.remove("hidden");