// Admin Attendance Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('searchAttendance');
  const attendanceDisplay = document.getElementById('attendanceDisplay');
  const dateInput = document.getElementById('attendanceDate');
  const lunchPeriodSelect = document.getElementById('lunchPeriod');

  // Set default date to today (Central Standard Time)
  const now = new Date();
  const today = now.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  dateInput.value = today;

  searchButton.addEventListener('click', async () => {
    const date = dateInput.value;
    const lunchPeriod = lunchPeriodSelect.value;

    // Validate inputs
    if (!date) {
      attendanceDisplay.innerHTML = `
        <div class="text-center text-red-500 italic py-8">
          Please select a date.
        </div>
      `;
      return;
    }

    if (!lunchPeriod) {
      attendanceDisplay.innerHTML = `
        <div class="text-center text-red-500 italic py-8">
          Please select a lunch period.
        </div>
      `;
      return;
    }

    // Show loading state
    attendanceDisplay.innerHTML = `
      <div class="text-center text-gray-500 italic py-8">
        Loading attendance data...
      </div>
    `;

    try {
      const response = await fetch(
        `/attendance/getAttendance?date=${encodeURIComponent(date)}&lunchPeriod=${encodeURIComponent(lunchPeriod)}`
      );
      const result = await response.json();

      if (!result.success) {
        attendanceDisplay.innerHTML = `
          <div class="text-center text-red-500 italic py-8">
            Error: ${result.error || 'Failed to fetch attendance data.'}
          </div>
        `;
        return;
      }

      if (!result.data) {
        attendanceDisplay.innerHTML = `
          <div class="text-center text-gray-500 italic py-8">
            There is no data for that selected date and lunch period.
          </div>
        `;
        return;
      }

      // Display the raw attendance data
      displayAttendanceData(result.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      attendanceDisplay.innerHTML = `
        <div class="text-center text-red-500 italic py-8">
          Network error. Please try again.
        </div>
      `;
    }
  });

  function displayAttendanceData(data) {
    const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let html = `
      <div class="mb-4">
        <p class="text-gray-700"><strong>Date:</strong> ${formattedDate}</p>
        <p class="text-gray-700"><strong>Lunch Period:</strong> ${data.lunchPeriod}</p>
        <p class="text-gray-700"><strong>Total Tutors:</strong> ${data.tutors ? data.tutors.length : 0}</p>
      </div>
    `;

    if (data.tutors && data.tutors.length > 0) {
      html += `
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-orange-100">
              <th class="border border-gray-300 px-4 py-2 text-left">Tutor ID</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Name</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Email</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.tutors.forEach(tutor => {
        const statusClass =
          tutor.status === 'present'
            ? 'text-green-600'
            : tutor.status === 'absent'
              ? 'text-red-600'
              : 'text-blue-600';

        html += `
          <tr>
            <td class="border border-gray-300 px-4 py-2">${tutor.tutorId || 'N/A'}</td>
            <td class="border border-gray-300 px-4 py-2">${tutor.tutorFirstName || ''} ${tutor.tutorLastName || ''}</td>
            <td class="border border-gray-300 px-4 py-2">${tutor.email || 'N/A'}</td>
            <td class="border border-gray-300 px-4 py-2 ${statusClass} font-semibold">${tutor.status || 'N/A'}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;
    } else {
      html += `
        <div class="text-center text-gray-500 italic py-4">
          No tutor records found in this attendance entry.
        </div>
      `;
    }

    // Also show raw JSON data for debugging
    html += `
      <div class="mt-6">
        <details class="bg-gray-100 rounded-lg p-4">
          <summary class="cursor-pointer text-gray-700 font-semibold">View Raw JSON Data</summary>
          <pre class="mt-2 text-xs overflow-auto bg-gray-200 p-2 rounded">${JSON.stringify(data, null, 2)}</pre>
        </details>
      </div>
    `;

    attendanceDisplay.innerHTML = html;
  }
});

