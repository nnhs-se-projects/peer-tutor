/**
 * Tutor expertise form: class search, selected-class list, and submission.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('expertiseForm');
  const courseSearch = document.getElementById('courseSearch');
  const courseCheckboxes = document.querySelectorAll('#courseList .courseCheckbox');
  const selectedCourses = document.getElementById('selectedCourses');

  // Classes only show up once the tutor starts searching
  function filterCourseList() {
    const query = courseSearch.value.toLowerCase();
    courseCheckboxes.forEach(checkbox => {
      const matches = query !== '' && checkbox.value.toLowerCase().includes(query);
      checkbox.parentElement.style.display = matches ? '' : 'none';
    });
  }

  function updateSelectedItems() {
    selectedCourses.innerHTML = '';
    document.querySelectorAll('#courseList .courseCheckbox:checked').forEach(checkbox => {
      const li = document.createElement('li');
      li.textContent = checkbox.value;
      selectedCourses.appendChild(li);
    });
  }

  courseSearch.addEventListener('input', filterCourseList);
  courseCheckboxes.forEach(checkbox => checkbox.addEventListener('change', updateSelectedItems));

  // Show any classes already saved on the tutor's record
  updateSelectedItems();

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const checkedValue = name => {
      const input = form.querySelector(`input[name='${name}']:checked`);
      return input ? input.value : null;
    };
    const checkedValues = name =>
      Array.from(form.querySelectorAll(`input[name='${name}']:checked`)).map(input => input.value);

    const grade = checkedValue('grade');
    const newReturning = checkedValue('newReturning');
    const lunchPeriod = checkedValue('lunchPeriod');

    if (!grade || !newReturning || !lunchPeriod) {
      alert('Please select your grade, new/returning status, and lunch period.');
      return;
    }

    const addingTutor = form.dataset.addingTutor === 'true';
    const formData = {
      tutorFirstName: document.getElementById('firstName').value,
      tutorLastName: document.getElementById('lastName').value,
      tutorID: document.getElementById('tutorID').value,
      grade,
      returning: newReturning === 'Returning',
      lunchPeriod,
      daysAvailable: checkedValues('dayOfTheWeek'),
      classes: checkedValues('courseList'),
      addingTutor,
    };
    if (addingTutor) {
      formData.email = document.getElementById('tutEmail').value;
    }

    try {
      const response = await fetch('/submitExpertiseForm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        alert('Form successfully submitted!');
        window.location = addingTutor ? '/tutorTable' : '/';
      } else {
        alert(result.error || 'There was an error submitting the form.');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('There was a network error submitting the form.');
    }
  });
});
