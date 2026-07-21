const API_BASE = "http://localhost:5001/api";

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}` };
}

function setupLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = "../Auth/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user || user.role !== 'student') {
    window.location.href = "../Auth/login.html";
    return;
  }

  // Setup logout buttons
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener("click", setupLogout);
  }

  const logoutBtnSidebar = document.getElementById('logout-btn');
  if (logoutBtnSidebar) {
    logoutBtnSidebar.addEventListener("click", setupLogout);
  }

  const welcomeMessage = document.querySelector('.main-content h1');
  const totalJobsCard = document.querySelector('.card:nth-of-type(1) p');
  const appliedJobsCard = document.querySelector('.card:nth-of-type(2) p');
  const profileCard = document.querySelector('.card:nth-of-type(3) p');

  async function loadDashboardData() {
    try {
      const res = await fetch(`${API_BASE}/student/dashboard`, {
        headers: getAuthHeaders()
      });
      
      if (!res.ok) {
        throw new Error('Failed to load dashboard data');
      }
      
      const data = await res.json();
      console.log('Dashboard data:', data);
      
      // Update welcome message
      if (welcomeMessage && data.user?.full_name) {
        welcomeMessage.textContent = `Welcome, ${data.user.full_name}!`;
      }
      
      // Update cards
      if (totalJobsCard) {
        totalJobsCard.textContent = `Total Jobs Available: ${data.totalJobs || 0}`;
      }
      
      if (appliedJobsCard) {
        appliedJobsCard.textContent = `Applications Submitted: ${data.totalApplications || 0}`;
      }
      
      if (profileCard) {
        profileCard.textContent = `Profile Completion: ${data.profileCompletion || 0}%`;
      }
      
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      
      // Fallback to individual API calls if dashboard endpoint fails
      loadFallbackData();
    }
  }

  async function loadFallbackData() {
    console.log('Loading fallback data...');
    
    // Load total jobs
    try {
      const res = await fetch(`${API_BASE}/jobs`);
      const data = await res.json();
      const jobs = data.jobs || data;
      if (totalJobsCard) totalJobsCard.textContent = `Total Jobs Available: ${jobs.length}`;
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      if (totalJobsCard) totalJobsCard.textContent = 'Failed to load jobs';
    }

    // Load applications
    try {
      const res = await fetch(`${API_BASE}/applications/my-applications`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      const apps = Array.isArray(data) ? data : (data.applications || []);
      if (appliedJobsCard) appliedJobsCard.textContent = `Applications Submitted: ${apps.length}`;
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      if (appliedJobsCard) appliedJobsCard.textContent = 'Failed to load applications';
    }

    // Calculate profile completion
    if (user) {
      const fields = ['full_name', 'email', 'mobile', 'skills', 'education', 'experience'];
      const filled = fields.filter(f => user[f] && user[f].toString().trim() !== '');
      const percent = Math.round((filled.length / fields.length) * 100);
      if (profileCard) profileCard.textContent = `Profile Completion: ${percent}%`;
    }
  }

  // Load dashboard data
  loadDashboardData();
});
