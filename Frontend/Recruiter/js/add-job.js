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

document.getElementById("jobForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const job = {
    title: document.getElementById("title").value,
    company: document.getElementById("company").value,
    location: document.getElementById("location").value,
    salary: document.getElementById("salary").value,
    type: document.getElementById("type").value,
    description: document.getElementById("description").value
  };

  // Validate required fields
  if (!job.title || !job.location) {
    const msgEl = document.getElementById("msg");
    msgEl.textContent = "Title and location are required!";
    msgEl.style.color = "red";
    return;
  }

  try {
    const res = await fetch(API + "/recruiter/jobs", {
      ...authFetchOptions(),
      method: "POST",
      body: JSON.stringify(job)
    });

    const data = await res.json();

    if (res.ok) {
      const msgEl = document.getElementById("msg");
      msgEl.textContent = "Job posted successfully! It will appear on the homepage shortly.";
      msgEl.style.color = "lightgreen";

      // Reset form
      document.getElementById("jobForm").reset();

      // Optionally redirect to my jobs after 3 seconds
      setTimeout(() => {
        if (confirm("Would you like to view your posted jobs?")) {
          window.location.href = "my-jobs.html";
        } else {
          // Or go to homepage to see the job
          window.location.href = "";
        }
      }, 3000);
    } else {
      throw new Error(data.error || 'Failed to post job');
    }
  } catch (error) {
    console.error('Error posting job:', error);
    const msgEl = document.getElementById("msg");
    msgEl.textContent = error.message || "Failed to post job. Please try again.";
    msgEl.style.color = "red";
  }
});

// Run auth check when page loads
checkAuth();