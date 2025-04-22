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

const submitButton = document.querySelector("input.submit");

submitButton.addEventListener('click', async event => {
  event.preventDefault(); // Prevent the default form submission

  // Get the values entered by the user
  const tutorFirstName = document.querySelector('input#tutorFirstName').value;
  const tutorLastName = document.querySelector('input#tutorLastName').value;
  const tutorID = document.querySelector('input#tutorID').value;
  const sessionDate = document.querySelector('input#sessionDate').value;
  const sessionPeriod = document.querySelector('select#sessionPeriod').value;
  const sessionPlace = document.querySelector('select#sessionPlace').value;
  const subject = document.querySelector('select#subject').value;
  const classValue = document.querySelector('select#class').value;
  const teacher = document.querySelector('select#teacher').value;
  const focusOfSession = document.querySelector('select#focusOfSession').value;
  const workAccomplished = document.querySelector('input#workAccomplished').value;
  const tuteeFirstName = document.querySelector('input#tuteeFirstName').value;
  const tuteeLastName = document.querySelector('input#tuteeLastName').value;
  const tuteeID = document.querySelector('input#tuteeID').value;
  const gradeButtons = document.querySelectorAll("input[name='tuteeGrade']:checked");
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

    // Show an alert based on the response and redirect to the homepage
    if (response.ok) {
      alert("Success putting into session table");
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error placing into session table:', errorData);
      alert('There was an error placing into session table.');
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('There was a network error placing into session table.');
  }
});
