document.addEventListener('DOMContentLoaded', function () {
  // Subject-class mapping
  const classOptions = {
    Math: [
      'Algebra I',
      'Geometry',
      'Algebra II',
      'Pre-Calculus',
      'Calculus AB',
      'Calculus BC',
      'Statistics',
    ],
    Science: ['Biology', 'Chemistry', 'Physics', 'Environmental Science', 'Anatomy'],
    English: [
      'English 9',
      'English 10',
      'English 11',
      'English 12',
      'AP Literature',
      'AP Language',
    ],
    History: ['World History', 'U.S. History', 'Government', 'Economics', 'Human Geography'],
    'Foreign Language': [
      'Spanish I',
      'Spanish II',
      'Spanish III',
      'French I',
      'French II',
      'Latin I',
      'Latin II',
    ],
    Other: ['Computer Science', 'Business', 'Psychology', 'Art History'],
  };

  // Populate class dropdown based on subject selection
  function populateClassDropdown(subjectId, classId) {
    const subjectSelect = document.getElementById(subjectId);
    const classSelect = document.getElementById(classId);

    subjectSelect.addEventListener('change', function () {
      const selectedSubject = this.value;

      // Clear current options
      classSelect.innerHTML = '<option value="">Select a class</option>';

      // If no subject is selected, return
      if (!selectedSubject) return;

      // Add class options based on selected subject
      classOptions[selectedSubject].forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        classSelect.appendChild(option);
      });
    });
  }

  // Initialize class dropdowns
  populateClassDropdown('subject', 'class');
  populateClassDropdown('requestSubject', 'requestClass');

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
              <div class="border rounded-lg p-4 hover:bg-gray-50">
                <div class="font-bold">${tutor.tutorFirstName} ${tutor.tutorLastName}</div>
                <div class="text-sm text-gray-600">Grade: ${tutor.grade}</div>
                <div class="text-sm text-gray-600">Lunch Period: ${tutor.lunchPeriod || 'Not set'}</div>
                <div class="text-sm text-gray-600">Available: ${tutor.daysAvailable.join(', ')}</div>
                <button 
                  class="mt-2 bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 text-sm"
                  onclick="requestTutor('${tutor._id}', '${tutor.tutorFirstName} ${tutor.tutorLastName}')"
                >
                  Request Session
                </button>
              </div>
            `;
          });
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

      // Get selected tutor info from banner if present
      const tutorBanner = document.getElementById('selectedTutorBanner');
      const tutorId = tutorBanner?.dataset?.tutorId || null;
      const tutorName = tutorBanner?.dataset?.tutorName || null;

      const formData = {
        subject: document.getElementById('requestSubject').value,
        class: document.getElementById('requestClass').value,
        topic: document.getElementById('requestTopic').value,
        preferredDate: document.getElementById('preferredDate').value,
        preferredPeriod: document.getElementById('lunchPeriod').value,
        additionalNotes: document.getElementById('additionalNotes').value,
        tutorId: tutorId,
        tutorName: tutorName,
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
            // Clear selected tutor banner
            const banner = document.getElementById('selectedTutorBanner');
            if (banner) banner.remove();
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
  // Pre-fill request form with selected tutor
  const subject = document.getElementById('subject').value;
  const className = document.getElementById('class').value;

  // Populate request form with current selections
  document.getElementById('requestSubject').value = subject;

  // Trigger subject change event to update class options
  const event = new Event('change');
  document.getElementById('requestSubject').dispatchEvent(event);

  // Set class after options are populated
  setTimeout(() => {
    document.getElementById('requestClass').value = className;
  }, 100);

  // Show selected tutor banner on the form
  const formContainer = document.querySelector('#tutoringRequestForm').parentElement;
  let tutorBanner = document.getElementById('selectedTutorBanner');

  if (!tutorBanner) {
    tutorBanner = document.createElement('div');
    tutorBanner.id = 'selectedTutorBanner';
    tutorBanner.className =
      'bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded-lg mb-4 flex justify-between items-center';
    formContainer.insertBefore(tutorBanner, document.getElementById('tutoringRequestForm'));
  }

  tutorBanner.innerHTML = `
    <div>
      <span class="font-bold">Selected Tutor:</span> ${tutorName}
    </div>
    <button type="button" onclick="clearSelectedTutor()" class="text-orange-600 hover:text-orange-800 font-bold text-lg">&times;</button>
  `;

  // Store tutor info for form submission
  tutorBanner.dataset.tutorId = tutorId;
  tutorBanner.dataset.tutorName = tutorName;

  // Scroll to request form
  document.querySelector('form#tutoringRequestForm').scrollIntoView({
    behavior: 'smooth',
  });

  // Display alert about the selection
  alert(`You've selected ${tutorName} as your tutor. Please complete the request form below.`);
}

// Function to clear selected tutor
function clearSelectedTutor() {
  const banner = document.getElementById('selectedTutorBanner');
  if (banner) {
    banner.remove();
  }
}
