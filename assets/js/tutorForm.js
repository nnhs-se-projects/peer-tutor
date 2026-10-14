/**
 * Tutor session form: department → class/teacher dropdowns, filling the form from an
 * accepted request, and submission. The tutor is always the signed-in account.
 */

// Subjects with their classes and teachers, keyed by the department dropdown values
let coursesData = {};

function fillOptions(select, placeholder, values) {
  select.innerHTML = '';
  select.appendChild(new Option(placeholder, ''));
  values.forEach(value => select.appendChild(new Option(value, value)));
}

// Update the class and teacher options for the selected department
function updateClasses() {
  const subject = document.getElementById('department').value;
  const department = coursesData[subject] || { classes: [], teachers: [] };

  fillOptions(document.getElementById('class'), 'Select a Class', department.classes);
  fillOptions(document.getElementById('teacher'), 'Select a Teacher', department.teachers);
}

document.addEventListener('DOMContentLoaded', async () => {
  const formEl = document.getElementById('tutorSessionForm');
  const departmentEl = document.getElementById('department');

  departmentEl.addEventListener('change', updateClasses);

  try {
    const response = await fetch('/api/courses');
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    coursesData = await response.json();
    updateClasses();
  } catch (error) {
    console.error('Error loading class lists:', error);
    alert('Could not load the class lists. Please reload the page.');
  }

  // Fill the form from an accepted request
  const acceptedRequestSelect = document.getElementById('acceptedRequestSelect');
  if (acceptedRequestSelect) {
    acceptedRequestSelect.addEventListener('change', function () {
      const selected = this.options[this.selectedIndex];
      document.getElementById('tutoringRequestId').value = this.value;
      if (!this.value) return;

      const { studentFirst, studentLast, subject, date, period, topic } = selected.dataset;

      // Tutee name in the expected "Last, First" format
      if (studentFirst || studentLast) {
        document.getElementById('tuteeName').value = `${studentLast}, ${studentFirst}`.trim();
      }

      if (subject) {
        departmentEl.value = subject;
        updateClasses();
        document.getElementById('class').value = selected.dataset.class || '';
      }

      if (date) document.getElementById('sessionDate').value = date;
      // Requests store the lunch period as a number ("4"); the form uses "4th"
      if (period) {
        document.getElementById('sessionPeriod').value = /^\d+$/.test(period)
          ? `${period}th`
          : period;
      }
      if (topic) document.getElementById('workaccomplished').value = topic;
    });
  }

  formEl.addEventListener('submit', async event => {
    event.preventDefault();

    const value = id => document.getElementById(id).value.trim();
    const formData = {
      sessionDate: value('sessionDate'),
      tuteeName: value('tuteeName'),
      sessionPeriod: value('sessionPeriod'),
      teacher: value('teacher'),
      department: value('department'),
      class: value('class'),
      focusOfSession: value('FocusOfSession'),
      workAccomplished: value('workaccomplished'),
      isMakeup: document.getElementById('isMakeup').checked,
      tutoringRequestId: document.getElementById('tutoringRequestId')?.value || '',
    };

    const required = Object.entries(formData).filter(
      ([key]) => !['isMakeup', 'tutoringRequestId'].includes(key)
    );
    if (required.some(([, fieldValue]) => !fieldValue)) {
      alert('Please fill in all required fields before submitting.');
      return;
    }

    try {
      const response = await fetch('/submitTutorForm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Form successfully submitted!');
        window.location = '/'; // Redirect to the homepage
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'There was an error submitting the form.');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('There was a network error submitting the form.');
    }
  });
});
