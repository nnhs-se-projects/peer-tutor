// Admin Attendance Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  const searchButton = document.getElementById('searchAttendance');
  const attendanceDisplay = document.getElementById('attendanceDisplay');
  const dateInput = document.getElementById('attendanceDate');
  const lunchPeriodSelect = document.getElementById('lunchPeriod');

  // Track current attendance data and pending changes
  let currentAttendanceData = null;
  let pendingChanges = new Map(); // Map of tutorId -> newStatus

  // Set default date to today (Central Standard Time)
  const now = new Date();
  const today = now.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  dateInput.value = today;

  searchButton.addEventListener('click', async () => {
    const date = dateInput.value;
    const lunchPeriod = lunchPeriodSelect.value;

    // Reset pending changes when searching
    pendingChanges.clear();
    currentAttendanceData = null;

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

      // Store current data for saving later
      currentAttendanceData = result.data;

      // Display the attendance data with editable dropdowns
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
        const statusOptions = ['present', 'absent', 'makeup'];
        const statusDropdown = statusOptions
          .map(status => {
            const selected = tutor.status === status ? 'selected' : '';
            return `<option value="${status}" ${selected}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`;
          })
          .join('');

        // Use MongoDB _id for identifying tutors since tutorId may not be populated
        const tutorIdentifier = tutor._id || tutor.tutorId;
        html += `
          <tr data-tutor-id="${tutorIdentifier}">
            <td class="border border-gray-300 px-4 py-2">${tutor.tutorId || 'N/A'}</td>
            <td class="border border-gray-300 px-4 py-2">${tutor.tutorFirstName || ''} ${tutor.tutorLastName || ''}</td>
            <td class="border border-gray-300 px-4 py-2">${tutor.email || 'N/A'}</td>
            <td class="border border-gray-300 px-4 py-2">
              <select 
                class="status-dropdown px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                data-tutor-id="${tutorIdentifier}"
                data-original-status="${tutor.status}"
              >
                ${statusDropdown}
              </select>
            </td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      // Add Save Changes button
      html += `
        <div class="mt-4 flex items-center gap-4">
          <button
            id="saveChangesBtn"
            class="bg-orange-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled
          >
            Save Changes
          </button>
          <span id="changeStatus" class="text-gray-500 text-sm"></span>
        </div>
      `;
    } else {
      html += `
        <div class="text-center text-gray-500 italic py-4">
          No tutor records found in this attendance entry.
        </div>
      `;
    }

    // // Also show raw JSON data for debugging
    // html += `
    //   <div class="mt-6">
    //     <details class="bg-gray-100 rounded-lg p-4">
    //       <summary class="cursor-pointer text-gray-700 font-semibold">View Raw JSON Data</summary>
    //       <pre class="mt-2 text-xs overflow-auto bg-gray-200 p-2 rounded">${JSON.stringify(data, null, 2)}</pre>
    //     </details>
    //   </div>
    // `;

    attendanceDisplay.innerHTML = html;

    // Add event listeners for status dropdowns
    setupDropdownListeners();
    setupSaveButton();
  }

  function setupDropdownListeners() {
    const dropdowns = document.querySelectorAll('.status-dropdown');

    dropdowns.forEach(dropdown => {
      dropdown.addEventListener('change', event => {
        // Use string ID since we're now using MongoDB _id
        const tutorId = event.target.dataset.tutorId;
        const originalStatus = event.target.dataset.originalStatus;
        const newStatus = event.target.value;

        console.log(
          `Dropdown change: tutorId=${tutorId}, original=${originalStatus}, new=${newStatus}`
        );

        // Track changes
        if (newStatus !== originalStatus) {
          pendingChanges.set(tutorId, newStatus);
          event.target.classList.add('bg-yellow-100', 'border-yellow-500');
        } else {
          pendingChanges.delete(tutorId);
          event.target.classList.remove('bg-yellow-100', 'border-yellow-500');
        }

        // Update UI
        updateSaveButtonState();
      });
    });
  }

  function setupSaveButton() {
    const saveBtn = document.getElementById('saveChangesBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveChanges);
    }
  }

  function updateSaveButtonState() {
    const saveBtn = document.getElementById('saveChangesBtn');
    const changeStatus = document.getElementById('changeStatus');

    if (saveBtn) {
      const hasChanges = pendingChanges.size > 0;
      saveBtn.disabled = !hasChanges;

      if (changeStatus) {
        if (hasChanges) {
          changeStatus.textContent = `${pendingChanges.size} unsaved change${pendingChanges.size > 1 ? 's' : ''}`;
          changeStatus.classList.remove('text-gray-500');
          changeStatus.classList.add('text-yellow-600');
        } else {
          changeStatus.textContent = '';
          changeStatus.classList.remove('text-yellow-600');
          changeStatus.classList.add('text-gray-500');
        }
      }
    }
  }

  async function saveChanges() {
    if (!currentAttendanceData || pendingChanges.size === 0) {
      return;
    }

    const saveBtn = document.getElementById('saveChangesBtn');
    const changeStatus = document.getElementById('changeStatus');

    // Disable button and show saving state
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    if (changeStatus) {
      changeStatus.textContent = 'Saving changes...';
      changeStatus.classList.remove('text-yellow-600');
      changeStatus.classList.add('text-blue-600');
    }

    try {
      // Prepare updates array
      const updates = Array.from(pendingChanges.entries()).map(([tutorId, newStatus]) => ({
        tutorId,
        newStatus,
      }));

      console.log('Saving changes:', { attendanceId: currentAttendanceData._id, updates });

      const response = await fetch('/attendance/bulkUpdateStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceId: currentAttendanceData._id,
          updates,
        }),
      });

      const result = await response.json();
      console.log('Save response:', result);

      if (result.success) {
        // Update original status for all changed dropdowns
        pendingChanges.forEach((newStatus, tutorId) => {
          // tutorId is now a string (MongoDB _id)
          const dropdown = document.querySelector(`.status-dropdown[data-tutor-id="${tutorId}"]`);
          if (dropdown) {
            dropdown.dataset.originalStatus = newStatus;
            dropdown.classList.remove('bg-yellow-100', 'border-yellow-500');
          }
        });

        // Clear pending changes
        pendingChanges.clear();

        // Update stored data
        currentAttendanceData = result.data;

        // Show success message
        if (changeStatus) {
          changeStatus.textContent = 'Changes saved successfully!';
          changeStatus.classList.remove('text-blue-600');
          changeStatus.classList.add('text-green-600');

          // Clear success message after 3 seconds
          setTimeout(() => {
            changeStatus.textContent = '';
            changeStatus.classList.remove('text-green-600');
            changeStatus.classList.add('text-gray-500');
          }, 3000);
        }

        // Update raw JSON display
        const detailsPre = document.querySelector('details pre');
        if (detailsPre) {
          detailsPre.textContent = JSON.stringify(result.data, null, 2);
        }
      } else {
        throw new Error(result.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      if (changeStatus) {
        changeStatus.textContent = `Error: ${error.message}`;
        changeStatus.classList.remove('text-blue-600');
        changeStatus.classList.add('text-red-600');
      }
    } finally {
      // Re-enable button and restore text
      saveBtn.textContent = 'Save Changes';
      updateSaveButtonState();
    }
  }
});

