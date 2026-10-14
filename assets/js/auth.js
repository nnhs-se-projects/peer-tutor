/**
 * Sends the credential from the Google Sign-In popup to the server, then goes to the
 * home page for the user's role.
 *
 * @param {Object} response - the response object from the Google Sign-In popup
 */

// Called by Google Sign-In (see data-callback on #g_id_onload)
// eslint-disable-next-line no-unused-vars
async function handleCredentialResponse(response) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.classList.add('hidden');

  try {
    const res = await fetch('/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: response.credential }),
    });

    if (res.status !== 201) {
      throw new Error((await res.text()) || 'Authentication failed');
    }

    const data = await res.json();
    const roleRedirects = {
      developer: '/adminHome', // Developers go to admin (have full access)
      admin: '/adminHome',
      teacher: '/teachHome',
      lead: '/leadHome',
      tutor: '/tutHome',
      student: '/stuHome',
    };
    window.location.href = roleRedirects[data.role] || '/';
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = error.message || 'Authentication failed. Please try again.';
    errorDiv.classList.remove('hidden');
  }
}
