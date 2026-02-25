document.addEventListener('DOMContentLoaded', function () {
  const requestsContainer = document.getElementById('requestsContainer');

  // Automatically load requests for the logged-in tutor
  loadRequests();

  function loadRequests() {
    requestsContainer.innerHTML =
      '<p class="text-center py-4 text-gray-500">Loading requests...</p>';

    fetch('/api/tutor/requests')
      .then(response => response.json())
      .then(data => {
        if (!data.success) {
          requestsContainer.innerHTML = `<p class="text-center py-4 text-red-500">${data.error}</p>`;
          return;
        }

        if (data.requests.length === 0) {
          requestsContainer.innerHTML =
            '<p class="text-center py-4 text-gray-500">No pending requests at this time.</p>';
          return;
        }

        let html = '<div class="space-y-4">';
        data.requests.forEach(request => {
          const d = new Date(request.preferredDate);
          const date = d.getUTCMonth() + 1 + '/' + d.getUTCDate() + '/' + d.getUTCFullYear();
          const statusClass =
            request.status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800';

          html += `
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="font-bold text-lg">${request.subject} - ${request.class}</span>
                  <span class="ml-2 px-2 py-1 rounded text-xs ${statusClass}">${request.status}</span>
                </div>
                <span class="text-sm text-gray-500">${new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
              <div class="text-gray-700 mb-2">
                <p><strong>Student:</strong> ${request.studentFirstName} ${request.studentLastName}</p>
                <p><strong>Topic:</strong> ${request.topic}</p>
                <p><strong>Preferred Date:</strong> ${date}</p>
                <p><strong>Period:</strong> ${request.preferredPeriod}</p>
                ${request.additionalNotes ? `<p><strong>Notes:</strong> ${request.additionalNotes}</p>` : ''}
              </div>
              ${
                request.status === 'pending'
                  ? `
                <div class="flex gap-2 mt-3">
                  <button 
                    onclick="respondToRequest('${request._id}', 'accepted')"
                    class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Accept
                  </button>
                  <button 
                    onclick="respondToRequest('${request._id}', 'declined')"
                    class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Decline
                  </button>
                </div>
              `
                  : ''
              }
            </div>
          `;
        });
        html += '</div>';
        requestsContainer.innerHTML = html;
      })
      .catch(error => {
        console.error('Error loading requests:', error);
        requestsContainer.innerHTML =
          '<p class="text-center py-4 text-red-500">Error loading requests. Please try again.</p>';
      });
  }

  // Make respondToRequest available globally
  window.respondToRequest = function (requestId, status) {
    const responseMessage =
      status === 'declined'
        ? prompt('Optional: Enter a reason for declining (or leave blank):')
        : '';

    fetch(`/api/tutor/requests/${requestId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, responseMessage: responseMessage || '' }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(`Request ${status} successfully!`);
          // Reload requests
          loadRequests();
        } else {
          alert('Error: ' + data.error);
        }
      })
      .catch(error => {
        console.error('Error responding to request:', error);
        alert('Error responding to request. Please try again.');
      });
  };
});

