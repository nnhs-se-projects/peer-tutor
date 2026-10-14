document.addEventListener('DOMContentLoaded', function () {
  // Fetch and display tutors based on selection
  const searchTutorsBtn = document.getElementById('searchTutors');
  if (searchTutorsBtn) {
    searchTutorsBtn.addEventListener('click', function () {
      const subject = document.getElementById('subject').value;
      const className = document.getElementById('class').value;
      const tutorResults = document.getElementById('tutorResults');

      if (!subject || !className) {
        tutorResults.innerHTML =
          '<div class="text-red-500">Please select both a subject and class</div>';
        return;
      }

      // Show loading state
      tutorResults.innerHTML = '<div class="text-center"><p>Searching for tutors...</p></div>';

      // Fetch tutors who can teach the selected subject/class
      const query = new URLSearchParams({ subject, class: className });
      fetch(`/api/tutors?${query}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(tutors => {
          if (tutors.length === 0) {
            tutorResults.innerHTML =
              '<div class="text-center text-gray-500">No tutors available for this subject/class.</div>';
            return;
          }

          // Display tutors (requesting a specific tutor is currently disabled)
          let html = '<div class="mt-4 space-y-4">';
          tutors.forEach(tutor => {
            html += `
              <div class="border rounded-lg p-4 bg-gray-100 text-gray-500 opacity-70 grayscale">
                <div class="font-bold">${escapeHtml(tutor.tutorFirstName)} ${escapeHtml(tutor.tutorLastName)}</div>
                <div class="text-sm text-gray-600">Grade: ${escapeHtml(tutor.grade)}</div>
                <div class="text-sm text-gray-600">Lunch Period: ${escapeHtml(tutor.lunchPeriod || 'Not set')}</div>
                <div class="text-sm text-gray-600">Available: ${escapeHtml((tutor.daysAvailable || []).join(', '))}</div>
                <button
                  type="button"
                  class="mt-2 bg-gray-300 text-gray-600 px-3 py-1 rounded-lg text-sm cursor-not-allowed"
                  disabled
                >
                  Request Session (Disabled)
                </button>
              </div>
            `;
          });
          html +=
            '<div class="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Feature currently disabled</div>';
          html += '</div>';
          tutorResults.innerHTML = html;
        })
        .catch(error => {
          console.error('Error fetching tutors:', error);
          tutorResults.innerHTML =
            '<div class="text-red-500">Error searching for tutors. Please try again.</div>';
        });
    });
  }

  // Handle tutoring request form submission. Requests go to the general request board.
  const tutoringRequestForm = document.getElementById('tutoringRequestForm');
  if (tutoringRequestForm) {
    tutoringRequestForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = {
        studentFirstName: document.getElementById('studentFirstName').value,
        studentLastName: document.getElementById('studentLastName').value,
        studentID: document.getElementById('studentID').value,
        studentGrade: document.getElementById('studentGrade').value,
        subject: document.getElementById('requestSubject').value,
        class: document.getElementById('requestClass').value,
        topic: document.getElementById('requestTopic').value,
        preferredDate: document.getElementById('preferredDate').value,
        preferredPeriod: document.getElementById('lunchPeriod').value,
        additionalNotes: document.getElementById('additionalNotes').value,
      };

      fetch('/api/tutoringRequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
        .then(response => response.json().catch(() => ({})))
        .then(data => {
          if (data.success) {
            alert('Your tutoring request has been submitted successfully!');
            tutoringRequestForm.reset();
          } else {
            alert('Error submitting request: ' + (data.error || 'Please try again.'));
          }
        })
        .catch(error => {
          console.error('Error submitting request:', error);
          alert('Error submitting request. Please try again.');
        });
    });
  }

  // Fill the subject and class dropdowns for both the search and the request form
  fetch('/api/courses')
    .then(response => response.json())
    .then(courses => {
      function populateSubjects(subjectSelectId, classSelectId) {
        const subjectSelect = document.getElementById(subjectSelectId);
        const classSelect = document.getElementById(classSelectId);
        subjectSelect.innerHTML = '<option value="">Select a subject</option>';
        Object.keys(courses).forEach(subject => {
          const option = document.createElement('option');
          option.value = subject;
          option.textContent = subject;
          subjectSelect.appendChild(option);
        });
        subjectSelect.addEventListener('change', function () {
          const selectedSubject = this.value;
          classSelect.innerHTML = '<option value="">Select a class</option>';
          if (selectedSubject && courses[selectedSubject]) {
            courses[selectedSubject].classes.forEach(className => {
              const option = document.createElement('option');
              option.value = className;
              option.textContent = className;
              classSelect.appendChild(option);
            });
          }
        });
      }
      populateSubjects('subject', 'class');
      populateSubjects('requestSubject', 'requestClass');
    });
});
