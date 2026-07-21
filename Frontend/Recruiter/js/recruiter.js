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

/* Load Dashboard Stats */
if (document.getElementById("totalJobs")) {
  fetch(API + "/recruiter/jobs/count", authFetchOptions())
    .then(r => {
      if (!r.ok) throw new Error('Failed to fetch stats');
      return r.json();
    })
    .then(d => {
      document.getElementById("totalJobs").textContent = d.count || 0;
    })
    .catch(err => {
      console.error('Error loading jobs count:', err);
      document.getElementById("totalJobs").textContent = "0";
    });

  // Also load total applicants
  fetch(API + "/recruiter/applicants", authFetchOptions())
    .then(r => {
      if (!r.ok) throw new Error('Failed to fetch applicants');
      return r.json();
    })
    .then(data => {
      document.getElementById("totalApplicants").textContent = data.length || 0;
    })
    .catch(err => {
      console.error('Error loading applicants count:', err);
      document.getElementById("totalApplicants").textContent = "0";
    });
}

/* Load Applicants */
if (document.getElementById("applicantsTable")) {
  fetch(API + "/recruiter/applicants", authFetchOptions())
    .then(r => {
      if (!r.ok) throw new Error('Failed to fetch applicants');
      return r.json();
    })
    .then(data => {
      const tableBody = document.getElementById("applicantsTable");
      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No applicants found</td></tr>';
        return;
      }

      tableBody.innerHTML = data.map(app => `
        <tr>
          <td>${app.name}</td>
          <td>${app.job}</td>
          <td>${app.email}</td>
          <td><span class="status ${app.status}">${app.status}</span></td>
        </tr>
      `).join("");
    })
    .catch(err => {
      console.error('Error loading applicants:', err);
      document.getElementById("applicantsTable").innerHTML = '<tr><td colspan="4">Error loading applicants</td></tr>';
    });
}

/* Load My Jobs */
if (document.getElementById("jobList")) {
  fetch(API + "/recruiter/jobs", authFetchOptions())
    .then(r => {
      if (!r.ok) throw new Error('Failed to fetch jobs');
      return r.json();
    })
    .then(data => {
      const jobList = document.getElementById("jobList");
      if (data.length === 0) {
        jobList.innerHTML = '<p>No jobs posted yet. <a href="add-job.html">Post your first job</a></p>';
        return;
      }

      jobList.innerHTML = data.map(job => `
        <div class="card">
          <h3>${job.title}</h3>
          <p><strong>Company:</strong> ${job.company}</p>
          <p><strong>Location:</strong> ${job.location}</p>
          <p><strong>Salary:</strong> $${job.salary}</p>
          <p><strong>Type:</strong> ${job.type}</p>
          <div class="job-actions">
            <button class="btn btn-edit" onclick="editJob(${job.id})">Edit</button>
            <button class="btn btn-delete" onclick="deleteJob(${job.id})">Delete</button>
            <button class="btn btn-view" onclick="viewApplicants(${job.id})">View Applicants</button>
          </div>
        </div>
      `).join("");
    })
    .catch(err => {
      console.error('Error loading jobs:', err);
      document.getElementById("jobList").innerHTML = '<p>Error loading jobs</p>';
    });
}

// Job management functions
window.editJob = function(jobId) {
  window.location.href = `edit-job.html?id=${jobId}`;
};

window.deleteJob = function(jobId) {
  if (confirm('Are you sure you want to delete this job?')) {
    fetch(`${API}/recruiter/jobs/${jobId}`, {
      ...authFetchOptions(),
      method: 'DELETE'
    })
    .then(r => {
      if (!r.ok) throw new Error('Failed to delete job');
      return r.json();
    })
    .then(() => {
      alert('Job deleted successfully');
      location.reload();
    })
    .catch(err => {
      console.error('Error deleting job:', err);
      alert('Failed to delete job');
    });
  }
};

window.viewApplicants = function(jobId) {
  window.location.href = `applicants.html?jobId=${jobId}`;
};

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

// Show registration credentials if available
function showRegistrationCredentials() {
  const registrationCredentials = localStorage.getItem('registrationCredentials');
  if (registrationCredentials) {
    const credentials = JSON.parse(registrationCredentials);
    const successDiv = document.getElementById('registrationSuccess');
    const emailSpan = document.getElementById('regEmail');
    const passwordSpan = document.getElementById('regPassword');

    if (successDiv && emailSpan && passwordSpan) {
      emailSpan.textContent = credentials.email;
      passwordSpan.textContent = credentials.password;
      successDiv.style.display = 'block';

      // Clear credentials after 3 seconds
      setTimeout(() => {
        localStorage.removeItem('registrationCredentials');
        successDiv.style.display = 'none';
      }, 3000);
    }
  }
}

// Run auth check and show credentials when page loads
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  showRegistrationCredentials();
});