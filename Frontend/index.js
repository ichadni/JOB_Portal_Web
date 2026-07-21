document.addEventListener('DOMContentLoaded', () => {
  const jobListEl = document.getElementById('job-list');
  const searchForm = document.querySelector('form');
  const jobTitleInput = searchForm.querySelector('input[placeholder="Job title or keyword"]');
  const locationInput = searchForm.querySelector('input[placeholder="Location"]');
  const typeButtons = document.querySelectorAll('.category-btn'); // now these are job types

  const searchButton = searchForm.querySelector('button');

  let jobsData = [];
  let currentType = '';

  // Fetch all jobs from backend
  async function fetchJobs() {
    try {
      const res = await fetch('http://localhost:5001/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');

      const data = await res.json();
      jobsData = Array.isArray(data.jobs) ? data.jobs : [];

      renderJobs();
    } catch (err) {
      console.error("Error fetching jobs:", err);
      jobListEl.innerHTML = "<p class='text-center text-gray-600'>Error loading jobs</p>";
    }
  }

  // Render job cards with Tailwind styling
  function renderJobs() {
    const searchTerm = jobTitleInput.value.toLowerCase();
    const locationTerm = locationInput.value.toLowerCase();

    const filteredJobs = jobsData.filter(job => {
      const titleMatch = job.title.toLowerCase().includes(searchTerm);
      const locationMatch = job.location.toLowerCase().includes(locationTerm);
      const typeMatch = currentType ? job.type === currentType : true;
      return titleMatch && locationMatch && typeMatch;
    });

    jobListEl.innerHTML = filteredJobs.length === 0
      ? "<p class='text-center text-gray-600 col-span-full'>No jobs found</p>"
      : filteredJobs.map(job => `
          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-semibold text-gray-800 mb-2">${job.title}</h3>
            <p class="text-gray-600 mb-1"><strong>Company:</strong> ${job.company}</p>
            <p class="text-gray-600 mb-1"><strong>Salary:</strong> ${job.salary || 'N/A'}</p>
            <p class="text-gray-600 mb-1"><strong>Location:</strong> ${job.location || 'N/A'}</p>
            <p class="text-gray-600 mb-4"><strong>Type:</strong> ${job.type || 'N/A'}</p>
            <button onclick="applyJob(${job.id})" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
  Apply Now
</button>

          </div>
        `).join('');
  }

  window.applyJob = function(id) {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token) {
        // Not logged in, redirect to login page with redirect query
        window.location.href = './Auth/Login.html?redirect=' + encodeURIComponent(`../Apply.html?id=${id}`);
        return;
    }

    if (user.role !== "student") {
        alert("Only students can apply for jobs.");
        return;
    }

    // Logged in as student, go to apply page
    window.location.href = `./Apply.html?id=${id}`;
};


  // Navigate to job details page
  // window.viewJob = function(id) {
  //   window.location.href = `./Student/job-list.html?id=${id}`;
  // };

  // Handle search form submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    renderJobs();
  });
   typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentType = btn.dataset.category; // currentType = Full-Time / Part-Time / etc.
      
      // Highlight selected button
      typeButtons.forEach(b => b.classList.remove('bg-indigo-600', 'text-white'));
      btn.classList.add('bg-indigo-600', 'text-white');

      renderJobs();
    });
  });

  // Real-time search on input
  jobTitleInput.addEventListener('input', renderJobs);
  locationInput.addEventListener('input', renderJobs);

  // Initial fetch
  fetchJobs();
});