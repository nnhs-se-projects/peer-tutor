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
      fetch(`/api/tutors?subject=${subject}&class=${className}`)
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

          // Display tutors
          let html = '<div class="mt-4 space-y-4">';
          tutors.forEach(tutor => {
            html += `
              <div class="border rounded-lg p-4 bg-gray-100 text-gray-500 opacity-70 grayscale">
                <div class="font-bold">${tutor.tutorFirstName} ${tutor.tutorLastName}</div>
                <div class="text-sm text-gray-600">Grade: ${tutor.grade}</div>
                <div class="text-sm text-gray-600">Lunch Period: ${tutor.lunchPeriod || 'Not set'}</div>
                <div class="text-sm text-gray-600">Available: ${tutor.daysAvailable.join(', ')}</div>
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

  // Handle tutoring request form submission
  const tutoringRequestForm = document.getElementById('tutoringRequestForm');
  if (tutoringRequestForm) {
    tutoringRequestForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const selectedTutorInput = document.getElementById('selectedTutorId');
      const tutorBanner = document.getElementById('selectedTutorBanner');
      const tutorId = selectedTutorInput?.value || tutorBanner?.dataset?.tutorId || '';
      const tutorName = tutorBanner?.dataset?.tutorName || null;
      const requestType = tutorId ? 'direct' : 'general';

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
        tutorId: tutorId,
        tutorName: tutorName,
        requestType,
      };

      // Submit form data
      fetch('/api/tutoringRequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            // Show success message
            alert('Your tutoring request has been submitted successfully!');
            tutoringRequestForm.reset();
            // Clear selected tutor banner and hidden input
            const banner = document.getElementById('selectedTutorBanner');
            if (banner) banner.remove();
            const hiddenInput = document.getElementById('selectedTutorId');
            if (hiddenInput) hiddenInput.value = '';
          } else {
            alert('Error submitting request: ' + data.error);
          }
        })
        .catch(error => {
          console.error('Error submitting request:', error);
          alert('Error submitting request. Please try again.');
        });
    });
  }

  // Load session history
  function loadSessionHistory() {
    const sessionHistory = document.getElementById('sessionHistory');

    if (!sessionHistory) return;

    // Show loading state
    sessionHistory.innerHTML = '<div class="text-center"><p>Loading your sessions...</p></div>';

    // Fetch session history for current student
    fetch('/api/student/sessions')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(sessions => {
        if (sessions.length === 0) {
          sessionHistory.innerHTML =
            '<div class="text-center text-gray-500 italic">No recent sessions found.</div>';
          return;
        }

        // Display sessions
        let html = '<div class="space-y-4">';
        sessions.forEach(session => {
          const sessionDate = new Date(session.sessionDate).toLocaleDateString();
          html += `
            <div class="border rounded-lg p-4 hover:bg-gray-50">
              <div class="font-bold">${session.subject} - ${session.class}</div>
              <div class="text-sm text-gray-600">Date: ${sessionDate}</div>
              <div class="text-sm text-gray-600">Tutor: ${session.tutorFirstName} ${session.tutorLastName}</div>
              <div class="text-sm">Focus: ${session.focusOfSession}</div>
              <div class="text-sm">Work Accomplished: ${session.workAccomplished}</div>
            </div>
          `;
        });
        html += '</div>';
        sessionHistory.innerHTML = html;
      })
      .catch(error => {
        console.error('Error fetching sessions:', error);
        sessionHistory.innerHTML =
          '<div class="text-red-500">Error loading session history. Please try again.</div>';
      });
  }

  // Load session history on page load
  loadSessionHistory();

  // Add this at the top of the file or after DOMContentLoaded
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

// Function to request a specific tutor
function requestTutor(tutorId, tutorName) {
  alert('Feature currently disabled');
  void tutorId;
  void tutorName;
}

// Function to clear selected tutor
function clearSelectedTutor() {
  const banner = document.getElementById('selectedTutorBanner');
  if (banner) {
    banner.remove();
  }
  // Clear the hidden input so the form requires a new selection
  const selectedTutorInput = document.getElementById('selectedTutorId');
  if (selectedTutorInput) selectedTutorInput.value = '';
}
