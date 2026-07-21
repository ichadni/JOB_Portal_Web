// ==================== Backend Base URL ====================
const API_BASE = "http://localhost:5001/api";

// ==================== Utility ====================
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}` };
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

// ==================== Auth & Role Check ====================
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  console.log("Auth check:", { hasToken: !!token, user });

  if (!token) {
    console.log("No token found - redirecting to login");
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `../Auth/login.html?redirect=${returnUrl}`;
    return false;
  }

  if (!user || user.role !== 'student') {
    console.log("Invalid user role:", user);
    alert("Access denied. Students only.");
    window.location.href = "../index.html";
    return false;
  }
  
  console.log("Authentication successful");
  return true;
}

// ==================== Job List Functions ====================
async function fetchJobs(filters = {}) {
  const jobListDiv = document.getElementById("job-list");
  if (!jobListDiv) return;
  
  jobListDiv.innerHTML = "<p>Loading jobs...</p>";

  try {
    const res = await fetch(`${API_BASE}/jobs`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");

    let jobs = data.jobs || data;

    // Apply filters
    if (filters.jobTitle) {
      jobs = jobs.filter(job => (job.title || job.job_position).toLowerCase().includes(filters.jobTitle.toLowerCase()));
    }
    if (filters.company) {
      jobs = jobs.filter(job => (job.company || job.company_name).toLowerCase().includes(filters.company.toLowerCase()));
    }
    if (filters.location) {
      jobs = jobs.filter(job => job.location && job.location.toLowerCase().includes(filters.location.toLowerCase()));
    }
    if (filters.skills) {
      jobs = jobs.filter(job => {
        const jobSkills = (job.skills || job.skills_required || "").toLowerCase();
        return jobSkills.includes(filters.skills.toLowerCase());
      });
    }
    if (filters.salaryRange) {
      jobs = jobs.filter(job => {
        const salary = parseFloat(job.salary || job.monthly_salary || 0);
        if (filters.salaryRange === '0-30000') return salary < 30000;
        if (filters.salaryRange === '30000-50000') return salary >= 30000 && salary < 50000;
        if (filters.salaryRange === '50000-70000') return salary >= 50000 && salary < 70000;
        if (filters.salaryRange === '70000-100000') return salary >= 70000 && salary < 100000;
        if (filters.salaryRange === '100000+') return salary >= 100000;
        return true;
      });
    }
    if (filters.jobType) {
      jobs = jobs.filter(job => {
        const jobType = (job.job_type || job.type || "").toLowerCase();
        return jobType.includes(filters.jobType.toLowerCase());
      });
    }

    if (jobs.length === 0) {
      jobListDiv.innerHTML = "<p>No jobs found matching your criteria.</p>";
      return;
    }

    jobListDiv.innerHTML = jobs.map(job => `
      <div class="job-card">
        <h4>${escapeHTML(job.title || job.job_position)}</h4>
        <p><strong>Company:</strong> ${escapeHTML(job.company || job.company_name)}</p>
        <p><strong>Location:</strong> ${escapeHTML(job.location)}</p>
        <p><strong>Salary:</strong> $${job.salary || job.monthly_salary || "N/A"}</p>
        <p><strong>Skills:</strong> ${escapeHTML(job.skills || job.skills_required || "N/A")}</p>
        <p><strong>Type:</strong> ${escapeHTML(job.job_type || job.type || "N/A")}</p>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
          <a href="../Apply.html?id=${job.id}" class="btn">Apply Now</a>
          <a href="job-details.html?id=${job.id}" class="btn">View Details</a>
        </div>
      </div>
    `).join("");

    // Update active filters display
    updateActiveFilters(filters);

  } catch (err) {
    jobListDiv.innerHTML = `<p style="color:red">${err.message}</p>`;
  }
}

// ==================== Button Functions ====================
function setupLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = "../Auth/login.html";
}

function applyFilters() {
  const filters = {
    jobTitle: document.getElementById("jobTitle")?.value.trim() || "",
    company: document.getElementById("company")?.value.trim() || "",
    location: document.getElementById("location")?.value.trim() || "",
    skills: document.getElementById("skills")?.value.trim() || "",
    salaryRange: document.getElementById("salaryRange")?.value || "",
    jobType: document.getElementById("jobType")?.value || "",
  };
  fetchJobs(filters);
}

function clearFilters() {
  const filterFields = ["jobTitle", "company", "location", "skills", "salaryRange", "jobType"];
  filterFields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) element.value = "";
  });
  
  // Clear active filters display
  const activeFiltersDiv = document.getElementById("activeFilters");
  if (activeFiltersDiv) activeFiltersDiv.innerHTML = "";
  
  fetchJobs();
}

function saveFilters() {
  const filters = {
    jobTitle: document.getElementById("jobTitle")?.value.trim() || "",
    company: document.getElementById("company")?.value.trim() || "",
    location: document.getElementById("location")?.value.trim() || "",
    skills: document.getElementById("skills")?.value.trim() || "",
    salaryRange: document.getElementById("salaryRange")?.value || "",
    jobType: document.getElementById("jobType")?.value || "",
  };
  
  localStorage.setItem('jobFilters', JSON.stringify(filters));
  
  // Show confirmation
  const activeFiltersDiv = document.getElementById("activeFilters");
  if (activeFiltersDiv) {
    activeFiltersDiv.innerHTML = '<span style="color: #52d8c7;">✓ Filters saved!</span>';
    setTimeout(() => updateActiveFilters(filters), 2000);
  }
}

function loadSavedFilters() {
  const savedFilters = localStorage.getItem('jobFilters');
  if (savedFilters) {
    const filters = JSON.parse(savedFilters);
    
    // Populate filter fields
    Object.keys(filters).forEach(key => {
      const element = document.getElementById(key);
      if (element && filters[key]) {
        element.value = filters[key];
      }
    });
    
    return filters;
  }
  return {};
}

function updateActiveFilters(filters) {
  const activeFiltersDiv = document.getElementById("activeFilters");
  if (!activeFiltersDiv) return;
  
  const activeFilters = [];
  if (filters.jobTitle) activeFilters.push(`Title: ${filters.jobTitle}`);
  if (filters.company) activeFilters.push(`Company: ${filters.company}`);
  if (filters.location) activeFilters.push(`Location: ${filters.location}`);
  if (filters.skills) activeFilters.push(`Skills: ${filters.skills}`);
  if (filters.salaryRange) {
    const salaryText = document.getElementById("salaryRange")?.options[document.getElementById("salaryRange")?.selectedIndex]?.text;
    activeFilters.push(`Salary: ${salaryText}`);
  }
  if (filters.jobType) {
    const typeText = document.getElementById("jobType")?.options[document.getElementById("jobType")?.selectedIndex]?.text;
    activeFilters.push(`Type: ${typeText}`);
  }
  
  if (activeFilters.length > 0) {
    activeFiltersDiv.innerHTML = `<strong>Active Filters:</strong> ${activeFilters.join(' | ')}`;
  } else {
    activeFiltersDiv.innerHTML = '';
  }
}

// ==================== Initialize Everything ====================
function initializeApp() {
  console.log("Initializing student job list...");
  
  // Setup event listeners first, then check auth
  setupEventListeners();
  
  // Check authentication after setting up listeners
  if (!checkAuth()) {
    console.log("Authentication failed - redirecting");
    return;
  }
  
  // Load saved filters and fetch jobs only if auth passes
  const savedFilters = loadSavedFilters();
  fetchJobs(savedFilters);
}

function setupEventListeners() {
  console.log("Setting up event listeners...");
  
  // Setup logout buttons
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener("click", setupLogout);
    console.log("Logout button listener attached");
  } else {
    console.error("Logout button not found");
  }

  const logoutBtnSidebar = document.getElementById('logout-btn');
  if (logoutBtnSidebar) {
    logoutBtnSidebar.addEventListener("click", setupLogout);
    console.log("Sidebar logout button listener attached");
  } else {
    console.error("Sidebar logout button not found");
  }

  // Setup filter buttons
  const applyFiltersBtn = document.getElementById("applyFilters");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", applyFilters);
    console.log("Apply filters button listener attached");
  } else {
    console.error("Apply filters button not found");
  }

  const clearFiltersBtn = document.getElementById("clearFilters");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearFilters);
    console.log("Clear filters button listener attached");
  } else {
    console.error("Clear filters button not found");
  }

  const saveFiltersBtn = document.getElementById("saveFilters");
  if (saveFiltersBtn) {
    saveFiltersBtn.addEventListener("click", saveFilters);
    console.log("Save filters button listener attached");
  } else {
    console.error("Save filters button not found");
  }
  
  console.log("Event listeners setup complete");
}

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", initializeApp);
