// Data structure to hold loaded data
let coursesData = {};

// Load department data from JSON files
async function loadDepartmentData() {
  try {
    const departments = [
      'math',
      'english',
      'cte',
      'fine-arts',
      'wellness',
      'science',
      'social-studies',
      'world-classical-language',
      'el-classes',
      'academic-support',
    ];

    let loadedCount = 0;

    for (const dept of departments) {
      try {
        console.log(`Attempting to load ${dept}.json...`);
        const response = await fetch(`/js/data/${dept}.json`);
        if (!response.ok) {
          console.error(`Error loading ${dept}.json: ${response.status} ${response.statusText}`);
          continue;
        }
        const data = await response.json();

        // Validate data structure
        if (
          !data.classes ||
          !Array.isArray(data.classes) ||
          !data.teachers ||
          !Array.isArray(data.teachers)
        ) {
          console.error(
            `Invalid data structure for ${dept}.json - missing classes or teachers arrays`
          );
          continue;
        }

        // Format the department name for display
        let formattedName = dept.charAt(0).toUpperCase() + dept.slice(1).replace(/-/g, ' ');

        // Special case for "EL classes"
        if (dept === 'el-classes') {
          formattedName = 'EL classes';
        }

        // Special case for World & Classical Language
        if (dept === 'world-classical-language') {
          formattedName = 'World & Classical Language';
        }

        coursesData[formattedName] = data;
        console.log(
          `✓ Successfully loaded data for ${formattedName} (${data.classes.length} classes, ${data.teachers.length} teachers)`
        );
        loadedCount++;
      } catch (error) {
        console.error(`Error processing ${dept}.json:`, error);
      }
    }

    console.log(`Total subjects loaded: ${loadedCount}/${departments.length}`);

    // Initialize the form after data is loaded
    initializeForm();
  } catch (error) {
    console.error('Error loading department data:', error);
  }
}

// Function to initialize the form
function initializeForm() {
  console.log('Form initialized with data for subjects:', Object.keys(coursesData));

  // Test if each subject has the proper format
  Object.keys(coursesData).forEach(subject => {
    console.log(
      `Subject "${subject}": ${coursesData[subject].classes.length} classes, ${coursesData[subject].teachers.length} teachers`
    );
  });

  // Make sure the dropdown options match our loaded data
  const subjectDropdown = document.getElementById('department');
  if (subjectDropdown) {
    const availableOptions = Array.from(subjectDropdown.options)
      .map(opt => opt.value)
      .filter(v => v !== '');
    console.log('Subject dropdown options:', availableOptions);

    // Check for any missing subjects in the dropdown
    const missingInDropdown = Object.keys(coursesData).filter(
      subject => !availableOptions.includes(subject)
    );
    if (missingInDropdown.length > 0) {
      console.warn('Warning: Some loaded subjects are not in the dropdown:', missingInDropdown);
    }

    // Check for any options in dropdown that we don't have data for
    const missingInData = availableOptions.filter(subject => !coursesData[subject]);
    if (missingInData.length > 0) {
      console.warn('Warning: Some dropdown options have no loaded data:', missingInData);
    }
  }
}

// Call loadDepartmentData when the page loads
document.addEventListener('DOMContentLoaded', loadDepartmentData);

// Function to update the class options based on the selected subject
function updateClasses() {
  const subject = document.getElementById('department').value;
  const classDropdown = document.getElementById('class');
  const teacherDropdown = document.getElementById('teacher');

  // Clear previous options
  classDropdown.innerHTML = '<option value="">Select a Class</option>';
  teacherDropdown.innerHTML = '<option value="">Select a Teacher</option>';

  console.log(`Subject selected: "${subject}"`);

  // Validate if we have data for this subject
  if (!subject) {
    console.log('No subject selected');
    return;
  }

  if (!coursesData[subject]) {
    console.error(`No data found for subject: "${subject}"`);
    console.log('Available subjects:', Object.keys(coursesData));
    return;
  }

  // Log the number of classes and teachers available for this subject
  console.log(
    `Loading ${coursesData[subject].classes.length} classes and ${coursesData[subject].teachers.length} teachers for ${subject}`
  );

  // Populate class dropdown based on selected subject
  const classes = coursesData[subject].classes;
  classes.forEach(course => {
    const option = document.createElement('option');
    option.value = course;
    option.textContent = course;
    classDropdown.appendChild(option);
  });

  // Populate teacher dropdown based on selected subject
  updateTeachers(subject);
}

// Function to update teacher options based on the selected subject
function updateTeachers(subject) {
  const teacherDropdown = document.getElementById('teacher');

  // Clear previous teacher options
  teacherDropdown.innerHTML = '<option value="">Select a Teacher</option>';

  if (subject && coursesData[subject]) {
    const teachers = coursesData[subject].teachers;
    teachers.forEach(teacher => {
      const option = document.createElement('option');
      option.value = teacher;
      option.textContent = teacher;
      teacherDropdown.appendChild(option);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Add event listener to the subject dropdown
  const subjectDropdown = document.getElementById('department');
  if (subjectDropdown) {
    subjectDropdown.addEventListener('change', updateClasses);
    console.log('Added change event listener to department dropdown');
  } else {
    console.error('Subject dropdown not found in the DOM');
  }

  // Accepted request dropdown auto-fill
  const acceptedRequestSelect = document.getElementById('acceptedRequestSelect');
  if (acceptedRequestSelect) {
    acceptedRequestSelect.addEventListener('change', function () {
      const selected = this.options[this.selectedIndex];
      const requestIdInput = document.getElementById('tutoringRequestId');

      if (!this.value) {
        // Cleared selection — reset the hidden field
        if (requestIdInput) requestIdInput.value = '';
        return;
      }

      // Store the request ID so it gets sent with the form
      if (requestIdInput) requestIdInput.value = this.value;

      // Auto-fill tutee info
      const tuteeFirst = document.getElementById('tuteeFirstName');
      const tuteeLast = document.getElementById('tuteeLastName');
      const tuteeID = document.getElementById('tuteeID');
      if (tuteeFirst) tuteeFirst.value = selected.dataset.studentFirst || '';
      if (tuteeLast) tuteeLast.value = selected.dataset.studentLast || '';
      if (tuteeID) tuteeID.value = selected.dataset.studentId || '';

      // Auto-fill tutee grade radio button
      const gradeVal = selected.dataset.grade || '';
      if (gradeVal) {
        const gradeRadio = document.querySelector(`input[name="grade"][value="${gradeVal}"]`);
        if (gradeRadio) gradeRadio.checked = true;
      }

      // Auto-fill subject, then trigger class list update
      const subjectEl = document.getElementById('subject');
      const subjectVal = selected.dataset.subject || '';
      if (subjectEl && subjectVal) {
        subjectEl.value = subjectVal;
        // Trigger the class/teacher dropdowns to populate
        updateClasses();

        // Wait briefly for the class dropdown to populate, then set the class value
        setTimeout(() => {
          const classEl = document.getElementById('class');
          const classVal = selected.dataset.class || '';
          if (classEl && classVal) {
            classEl.value = classVal;
          }
        }, 200);
      }

      // Auto-fill session date
      const dateEl = document.getElementById('sessionDate');
      const dateVal = selected.dataset.date || '';
      if (dateEl && dateVal) dateEl.value = dateVal;

      // Auto-fill session period
      const periodEl = document.getElementById('sessionPeriod');
      const periodVal = selected.dataset.period || '';
      if (periodEl && periodVal) periodEl.value = periodVal;

      // Auto-fill work accomplished / topic
      const workEl = document.getElementById('workaccomplished');
      const topicVal = selected.dataset.topic || '';
      if (workEl && topicVal) workEl.value = topicVal;
    });
  }

  const submitButton = document.querySelector('input.submit');

  if (submitButton) {
    submitButton.addEventListener('click', async event => {
      event.preventDefault(); // Prevent the default form submission

      // Get the values entered by the user
      const tutorName = document.querySelector('#tutorName').value;
      const sessionDate = document.querySelector('#sessionDate').value;
      const sessionPeriod = document.querySelector('#sessionPeriod').value;
      const department = document.querySelector('#department').value;
      const classValue = document.querySelector('#class').value;
      const teacher = document.querySelector('#teacher').value;
      const focusOfSession = document.querySelector('#FocusOfSession').value;
      const workAccomplished = document.querySelector('#workaccomplished').value;
      const isMakeup = document.querySelector('#isMakeup').checked;
      const tuteeName = document.querySelector('#tuteeName').value;

      console.log('Form values:', {
        department,
        class: classValue,
        teacher,
      });

      // Validate require`d fields before submitting
      if (
        !tutorName ||
        !sessionDate ||
        !sessionPeriod ||
        !department ||
        !classValue ||
        !teacher ||
        !focusOfSession ||
        !workAccomplished ||
        !tuteeName
      ) {
        alert('Please fill in all required fields before submitting.');
        return;
      }

      // Include linked tutoring request ID if one was selected
      const tutoringRequestIdEl = document.getElementById('tutoringRequestId');
      const tutoringRequestId = tutoringRequestIdEl ? tutoringRequestIdEl.value : '';

      const formData = {
        sessionDate,
        tuteeName,
        tutorName,
        sessionPeriod,
        teacher,
        department,
        class: classValue,
        focusOfSession,
        workAccomplished,
        isMakeup,
      };

      try {
        const response = await fetch('/submitTutorForm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        // Show an alert based on the response and redirect to the homepage
        if (response.ok) {
          alert('Form successfully submitted!');
          window.location = '/'; // Redirect to the homepage
        } else {
          const errorData = await response.json();
          console.error('Error submitting form:', errorData);
          alert('There was an error submitting the form.');
        }
      } catch (error) {
        console.error('Network error:', error);
        alert('There was a network error submitting the form.');
      }
    });
  } else {
    console.error('Submit button not found');
  }
});

