/**
 * contains client-side Javascript functions
 *  (primarily event handlers to fetch data from the Node server)
 */

const submitButton = document.querySelector('input.submit');

submitButton.addEventListener('click', async event => {
  event.preventDefault(); // Prevent the default form submission

  // Get the values entered by the user
  const tutorFirstName = document.querySelector('input#firstName').value;
  const tutorLastName = document.querySelector('input#lastName').value;
  const tutorID = document.querySelector('input#tutorID').value;
  const email = document.querySelector('input#tutEmail').value;
  const grade = document.querySelector("input[name='grade']:checked").value;
  const returning =
    document.querySelector("input[name='newReturning']:checked").value === 'Returning';
  const lunchPeriod = document.querySelector("input[name='lunchPeriod']:checked").value;
  const daysAvailable = Array.from(
    document.querySelectorAll("input[name='dayOfTheWeek']:checked")
  ).map(input => input.value);
  const classes = Array.from(document.querySelectorAll("input[name='courseList']:checked")).map(
    input => input.value
  );
  const tutorLeader = false;
  const attendance = 0;
  const sessionHistory = []; // Assuming session history is not part of the form submission

  const formData = {
    tutorFirstName,
    tutorLastName,
    tutorID,
    email,
    grade,
    returning,
    lunchPeriod,
    daysAvailable,
    classes,
    tutorLeader,
    attendance,
    sessionHistory,
  };

  try {
    const response = await fetch('/submitExpertiseForm', {
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
