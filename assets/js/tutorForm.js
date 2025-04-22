// Data structure to hold loaded data
let coursesData = {};

// Load department data from JSON files
async function loadDepartmentData() {
  try {
    const departments = ['math', 'english', 'cte', 'fine-arts', 'wellness'];
    for (const dept of departments) {
      const response = await fetch(`/js/data/${dept}.json`);
      const data = await response.json();
      coursesData[dept.charAt(0).toUpperCase() + dept.slice(1).replace('-', ' ')] = data;
    }
    // Initialize the form after data is loaded
    initializeForm();
  } catch (error) {
    console.error('Error loading department data:', error);
  }
}

// Function to initialize the form
function initializeForm() {
  // Just log that data was loaded successfully
  console.log('Form initialized with data:', Object.keys(coursesData));
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

  console.log('Subject selected:', subject);
  console.log('Available data keys:', Object.keys(coursesData));

  // Populate class dropdown based on selected subject
  if (subject && coursesData[subject]) {
    const classes = coursesData[subject].classes;
    classes.forEach(course => {
      const option = document.createElement('option');
      option.value = course;
      option.textContent = course;
      classDropdown.appendChild(option);
    });

    // Populate teacher dropdown based on selected subject
    updateTeachers(subject);
  } else {
    console.error('No data found for subject:', subject);
  }
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
