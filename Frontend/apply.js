// ==================== Backend Base URL ====================
const API_BASE = "http://localhost:5001/api";

// ==================== Utility Functions ====================
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}` };
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get('id')
  };
}

// ==================== Auth Check ====================
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  console.log("Apply page auth check:", { hasToken: !!token, user });

  if (!token) {
    console.log("No token found - redirecting to login");
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `./Auth/Login.html?redirect=${returnUrl}`;
    return false;
  }

  if (!user || user.role !== 'student') {
    console.log("Invalid user role:", user);
    alert("Access denied. Students only.");
    window.location.href = "./index.html";
    return false;
  }
  
  console.log("Authentication successful");
  return true;
}

// ==================== Job Details Fetch ====================
async function fetchJobDetails(jobId) {
  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`);
    if (!res.ok) throw new Error('Failed to fetch job details');
    
    const job = await res.json();
    return job;
  } catch (err) {
    console.error('Error fetching job details:', err);
    return null;
  }
}

// ==================== Populate Job Details ====================
function populateJobDetails(job) {
  if (!job) {
    document.getElementById('job-details').innerHTML = '<p style="color: red;">Job not found</p>';
    return;
  }

  document.getElementById('jobTitle').textContent = job.title || job.job_position || 'N/A';
  document.getElementById('jobCompany').textContent = job.company || job.company_name || 'N/A';
  document.getElementById('jobLocation').textContent = job.location || 'N/A';
  document.getElementById('jobSalary').textContent = job.salary || job.monthly_salary ? `$${job.salary || job.monthly_salary}` : 'N/A';
  document.getElementById('jobType').textContent = job.job_type || job.type || 'N/A';
  document.getElementById('jobDescription').textContent = job.description || 'No description available';
}

// ==================== Form Handling ====================
async function handleApplicationSubmit(e) {
  e.preventDefault();

  const jobId = getQueryParams().id;
  const user = JSON.parse(localStorage.getItem('user'));

  // Create new FormData
  const formData = new FormData();
  formData.append("job_id", jobId);
  formData.append("name", document.getElementById("applicantName").value);
  formData.append("email", document.getElementById("applicantEmail").value);
  formData.append("cover_letter", document.getElementById("coverLetter").value);

  // Attach resume file
  const resumeFile = document.getElementById("resume").files[0];
  if (resumeFile) {
    formData.append("resume", resumeFile);
  }

  try {
    const submitBtn = document.querySelector('.btn-submit');
    const msgEl = document.getElementById('applyMsg');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    msgEl.textContent = '';

    const res = await fetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(), // DO NOT set Content-Type
      },
      body: formData
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Failed to submit application");
    }

    msgEl.textContent = "Application submitted successfully!";
    msgEl.style.color = "#16a34a";
    msgEl.style.display = "block";
    msgEl.style.fontSize = "18px";
    msgEl.style.fontWeight = "bold";
    console.log("Success message set:", msgEl.textContent);

    e.target.reset();

    setTimeout(() => {
      console.log("Redirecting to applied-jobs.html");
      window.location.href = "./Student/applied-jobs.html";
    }, 8000); // Increased to 8 seconds to see the message

  } catch (err) {
    console.error("Error submitting application:", err);
    const msgEl = document.getElementById("applyMsg");
    msgEl.textContent = err.message || "Failed to submit application.";
    msgEl.style.color = "#dc2626";
    msgEl.style.display = "block";
    msgEl.style.fontSize = "16px";
    msgEl.style.fontWeight = "bold";
    console.log("Error message set:", msgEl.textContent);
    
    // Show error message for 8 seconds, then reset form
    setTimeout(() => {
      msgEl.textContent = "";
      msgEl.style.display = "none";
      e.target.reset();
    }, 8000);
  } finally {
    const submitBtn = document.querySelector(".btn-submit");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";
  }
}


// ==================== Initialize ====================
async function initializeApplyPage() {
  console.log("Initializing apply page...");
  
  // Check authentication first
  if (!checkAuth()) {
    console.log("Authentication failed - redirecting");
    return;
  }

  const jobId = getQueryParams().id;
  if (!jobId) {
    document.getElementById('job-details').innerHTML = '<p style="color: red;">No job ID provided</p>';
    return;
  }

  console.log("Fetching job details for ID:", jobId);
  
  // Fetch and populate job details
  const job = await fetchJobDetails(jobId);
  populateJobDetails(job);

  // Setup form submission
  const applyForm = document.getElementById('applyForm');
  if (applyForm) {
    applyForm.addEventListener('submit', handleApplicationSubmit);
    
    // Pre-fill user data if available
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      const nameField = document.getElementById('applicantName');
      const emailField = document.getElementById('applicantEmail');
      
      if (nameField && user.name) nameField.value = user.name;
      if (emailField && user.email) emailField.value = user.email;
    }
  }
}

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", initializeApplyPage);