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

// Load Dashboard Stats
async function loadDashboardStats() {
  try {
    // Load total jobs count
    const jobsResponse = await fetch(API + "/recruiter/jobs/count", authFetchOptions());
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      document.getElementById("totalJobs").textContent = jobsData.count || 0;
    } else {
      document.getElementById("totalJobs").textContent = "0";
    }

    // Load total applicants count
    const applicantsResponse = await fetch(API + "/recruiter/applicants", authFetchOptions());
    if (applicantsResponse.ok) {
      const applicantsData = await applicantsResponse.json();
      document.getElementById("totalApplicants").textContent = applicantsData.length || 0;
    } else {
      document.getElementById("totalApplicants").textContent = "0";
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    document.getElementById("totalJobs").textContent = "0";
    document.getElementById("totalApplicants").textContent = "0";
  }
}

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
      localStorage.removeItem('token');
      window.location.href = '../Auth/login.html';
    })
    .catch(err => {
      console.error('Error during logout:', err);
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

      setTimeout(() => {
        localStorage.removeItem('registrationCredentials');
        successDiv.style.display = 'none';
      }, 3000);
    }
  }
}

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  showRegistrationCredentials();
  loadDashboardStats();
});