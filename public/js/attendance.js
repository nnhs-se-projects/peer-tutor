async function updateAttendance(tutorId, change) {
  try {
    const response = await fetch("/updateAttendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tutorId, change }),
    });
    if (response.ok) {
      location.reload(); // Reload the page to reflect changes
    } else {
      console.error("Failed to update attendance");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
