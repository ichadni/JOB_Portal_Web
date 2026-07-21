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

// Load My Jobs
if (document.getElementById("jobList")) {
  fetch(API + "/recruiter/jobs", authFetchOptions())
    .then(r => {
      if (!r.ok) throw new Error('Failed to fetch jobs');
      return r.json();
    })
    .then(data => {
      const jobList = document.getElementById("jobList");
      if (data.error) {
        jobList.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
        return;
      }
      if (data.length === 0) {
        jobList.innerHTML = '<p>No jobs posted yet. <a href="add-job.html">Post your first job</a></p>';
        return;
      }

      jobList.innerHTML = data.map(job => `
        <div class="card">
          <h3>${job.title}</h3>
          <p><strong>Company:</strong> ${job.company}</p>
          <p><strong>Location:</strong> ${job.location || 'Not specified'}</p>
          <p><strong>Salary:</strong> ${job.salary ? '$' + job.salary : 'Not specified'}</p>
          <p><strong>Type:</strong> ${job.type || 'Not specified'}</p>
          <p><strong>Description:</strong> ${job.description || 'No description'}</p>
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
      const jobList = document.getElementById("jobList");
      jobList.innerHTML = `<p style="color: red;">Error loading jobs: ${err.message}</p>`;
    });
}

// Job management functions
window.editJob = function(jobId) {
  // For now, redirect to add-job with edit parameter
  window.location.href = `add-job.html?edit=${jobId}`;
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

// Run auth check when page loads
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
});