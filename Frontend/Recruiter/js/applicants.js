const API = "http://localhost:5001/api";

// Get auth token
function getAuthToken() {
  return localStorage.getItem('token');
}

// Common fetch options with auth
function authFetchOptions(options = {}) {
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
      ...options.headers
    }
  };
}

let allApplicants = [];

// Load applicants
async function loadApplicants() {
  try {
    const response = await fetch(API + "/recruiter/applicants", authFetchOptions());
    if (!response.ok) throw new Error('Failed to fetch applicants');

    allApplicants = await response.json();
    populateJobFilter();

    // Check for jobId in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get("jobId");

    if (jobId) {
      const jobFilter = document.getElementById("jobFilter");
      // Check if this job exists in our filter options (meaning it has applicants)
      const optionExists = [...jobFilter.options].some(opt => opt.value == jobId);

      if (optionExists) {
        jobFilter.value = jobId;
      } else {
        // If we have a jobId but no applicants for it, the filter won't have this option.
        // In this case, we should show no results instead of all results.
        // We can create a temporary valid option or just force empty display.
        // Let's force empty display by passing a dummy filter matching nothing
        displayApplicants([]);
        return;
      }
    }

    filterAndDisplayApplicants();
  } catch (error) {
    console.error('Error loading applicants:', error);
    document.getElementById("applicantsTable").innerHTML = '<tr><td colspan="7">Error loading applicants</td></tr>';
  }
}

// Populate job filter dropdown
function populateJobFilter() {
  const jobFilter = document.getElementById("jobFilter");
  // Clear existing options except the first one
  while (jobFilter.options.length > 1) {
    jobFilter.remove(1);
  }

  const jobsMap = new Map();
  allApplicants.forEach(app => {
    if (app.job_id && !jobsMap.has(app.job_id)) {
      jobsMap.set(app.job_id, app.job);
    }
  });

  jobsMap.forEach((title, id) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = title;
    jobFilter.appendChild(option);
  });
}

// Filter and display applicants
function filterAndDisplayApplicants() {
  const jobFilterId = document.getElementById("jobFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;

  let filtered = allApplicants;

  if (jobFilterId) {
    filtered = filtered.filter(app => app.job_id == jobFilterId);
  }

  if (statusFilter) {
    filtered = filtered.filter(app => app.status === statusFilter);
  }

  displayApplicants(filtered);
}

// Display applicants in table
function displayApplicants(applicants) {
  const tableBody = document.getElementById("applicantsTable");
  const noApplicants = document.getElementById("noApplicants");

  if (applicants.length === 0) {
    tableBody.innerHTML = '';
    noApplicants.style.display = 'block';
    return;
  }

  noApplicants.style.display = 'none';

  tableBody.innerHTML = applicants.map(app => `
    <tr>
      <td>${app.name}</td>
      <td>${app.job}</td>
      <td>${app.email}</td>
      <td>
        ${app.cover_letter ?
          `<button class="btn btn-small" onclick="viewCoverLetter('${app.cover_letter.replace(/'/g, "\\'")}')">View</button>` :
          'No cover letter'
        }
      </td>
      <td>
        ${app.resume_path ?
          `<a href="http://localhost:5001${app.resume_path}" target="_blank" class="btn btn-small">View Resume</a>` :
          'No resume'
        }
      </td>
      <td>
        <span class="status ${app.status}">${app.status}</span>
      </td>
      <td>
        <select class="status-select" onchange="updateStatus(${app.id}, this.value)">
          <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="reviewed" ${app.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
          <option value="accepted" ${app.status === 'accepted' ? 'selected' : ''}>Accepted</option>
          <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
    </tr>
  `).join('');
}

// Update application status
async function updateStatus(applicantId, newStatus) {
  try {
    const response = await fetch(`${API}/recruiter/applications/${applicantId}/status`, {
      ...authFetchOptions(),
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error('Failed to update status');

    // Reload applicants to reflect changes
    await loadApplicants();
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status');
  }
}

// View cover letter
window.viewCoverLetter = function(coverLetter) {
  alert(`Cover Letter:\n\n${coverLetter}`);
};

// Make functions globally available
window.updateStatus = updateStatus;

// Event listeners
document.getElementById("jobFilter").addEventListener("change", filterAndDisplayApplicants);
document.getElementById("statusFilter").addEventListener("change", filterAndDisplayApplicants);

// Logout function
window.logout = function() {
  if (confirm('Are you sure you want to logout?')) {
    fetch(`${API}/auth/logout`, {
      ...authFetchOptions(),
      method: 'POST'
    })
    .then(r => {
      if (!r.ok) throw new Error('Logout failed');
      return r.json();
    })
    .then(() => {
      // Remove token from localStorage
      localStorage.removeItem('token');
      // Redirect to login page
      window.location.href = '../Auth/login.html';
    })
    .catch(err => {
      console.error('Error during logout:', err);
      // Even if API call fails, remove token and redirect
      localStorage.removeItem('token');
      window.location.href = '../Auth/login.html';
    });
  }
};

// Check authentication on page load
function checkAuth() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = '../Auth/login.html';
    return;
  }

  // Verify token is valid by checking user info
  fetch(`${API}/auth/me`, authFetchOptions())
    .then(r => {
      if (!r.ok) {
        throw new Error('Invalid token');
      }
      return r.json();
    })
    .then(data => {
      if (data.user.role !== 'recruiter') {
        alert('Access denied. Recruiter role required.');
        localStorage.removeItem('token');
        window.location.href = '../Auth/login.html';
      }
    })
    .catch(err => {
      console.error('Auth check failed:', err);
      localStorage.removeItem('token');
      window.location.href = '../Auth/login.html';
    });
}

// Load applicants when page loads
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadApplicants();
});