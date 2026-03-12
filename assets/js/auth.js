/**
 * Sends the credentials from the Google Sign-In popup to the server for authentication
 *
 * @param {Object} res - the response object from the Google Sign-In popup
 */

// eslint-disable-next-line no-unused-vars
async function handleCredentialResponse(res) {
  try {
    const response = await fetch('/auth', {
      // send the googleUser's id_token which has all the data we want to the server with a POST request
      method: 'POST',
      body: JSON.stringify({
        credential: res.credential,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();

    // Redirect based on returned role
    if (data.role) {
      window.location = '/';
    } else {
      alert('Authentication failed. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Authentication failed. Please try again.');
  }
}

