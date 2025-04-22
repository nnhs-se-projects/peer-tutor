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
  const subjectDropdown = document.getElementById('subject');
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
  const subject = document.getElementById('subject').value;
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
  const subjectDropdown = document.getElementById('subject');
  if (subjectDropdown) {
    subjectDropdown.addEventListener('change', updateClasses);
    console.log('Added change event listener to subject dropdown');
  } else {
    console.error('Subject dropdown not found in the DOM');
  }

  const submitButton = document.querySelector('input.submit');

  if (submitButton) {
    submitButton.addEventListener('click', async event => {
      event.preventDefault(); // Prevent the default form submission

      // Get the values entered by the user
      const tutorFirstName = document.querySelector('#tutorFirstName').value;
      const tutorLastName = document.querySelector('#tutorLastName').value;
      const tutorID = document.querySelector('#tutorID').value;
      const sessionDate = document.querySelector('#sessionDate').value;
      const sessionPeriod = document.querySelector('#sessionPeriod').value;
      const sessionPlace = document.querySelector('#sessionPlace').value;
      const subject = document.querySelector('#subject').value;
      const classValue = document.querySelector('#class').value;
      const teacher = document.querySelector('#teacher').value;
      const focusOfSession = document.querySelector('#FocusOfSession').value;
      const workAccomplished = document.querySelector('#workaccomplished').value;
      const tuteeFirstName = document.querySelector('#tuteeFirstName').value;
      const tuteeLastName = document.querySelector('#tuteeLastName').value;
      const tuteeID = document.querySelector('#tuteeID').value;
      const gradeButtons = document.querySelectorAll('input[name="grade"]:checked');
      const tuteeGrade = gradeButtons.length > 0 ? gradeButtons[0].value : null;

      console.log('Form values:', {
        subject,
        class: classValue,
        teacher,
      });

      const formData = {
        tutorFirstName,
        tutorLastName,
        tutorID,
        sessionDate,
        sessionPeriod,
        sessionPlace,
        subject,
        class: classValue,
        teacher,
        focusOfSession,
        workAccomplished,
        tuteeFirstName,
        tuteeLastName,
        tuteeID,
        tuteeGrade,
      };

      const sessionData = {
        tuteeFirstName,
        tuteeLastName,
        tuteeID,
        sessionDate,
        tutorFirstName,
        tutorLastName,
        tutorID,
        subject,
        class: classValue,
        workAccomplished,
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

      // session table try
      try {
        const response = await fetch('/sessionTable', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData),
        });

        // Show an alert based on the response
        if (response.ok) {
          console.log('Success putting into session table');
        } else {
          const errorData = await response.json();
          console.error('Error placing into session table:', errorData);
          alert('There was an error placing into session table.');
        }
      } catch (error) {
        console.error('Network error:', error);
        alert('There was a network error placing into session table.');
      }
    });
  } else {
    console.error('Submit button not found');
  }
});
