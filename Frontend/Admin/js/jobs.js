document.addEventListener("DOMContentLoaded", async () => {
  // ================= Initial Setup =================
  await checkAdminAuth();
  const tableBody = document.querySelector("tbody");
  const logoutBtn = document.getElementById("logout");

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../Auth/login.html";
  });

  // ================= Edit Job =================
  async function loadJobForEdit(id) {
    try {
      const res = await fetchWithAuth(`/admin/jobs/${id}`);
      if (!res || !res.ok) return alert("Failed to load job data");

      const job = await res.json();

      document.getElementById("editJobId").value = job.id;
      document.getElementById("editTitle").value = job.title;
      document.getElementById("editCompany").value = job.company;
      document.getElementById("editLocation").value = job.location || '';
      document.getElementById("editType").value = job.type || 'Full-time';
      document.getElementById("editSalary").value = job.salary || '';
      document.getElementById("editDescription").value = job.description || '';

      document.getElementById("editModal").style.display = "block";
    } catch (err) {
      console.error(err);
      alert("Error loading job data");
    }
  }

  window.closeEditModal = function() {
    document.getElementById("editModal").style.display = "none";
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("editJobId").value;
    const jobData = {
      title: document.getElementById("editTitle").value,
      company: document.getElementById("editCompany").value,
      location: document.getElementById("editLocation").value,
      type: document.getElementById("editType").value,
      salary: document.getElementById("editSalary").value,
      description: document.getElementById("editDescription").value
    };

    try {
      const res = await fetchWithAuth(`/admin/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData)
      });

      if (res && res.ok) {
        alert("Job updated successfully");
        closeEditModal();
        loadJobs();
      } else {
        alert("Failed to update job");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating job");
    }
  }

  // ================= Load Jobs =================
  async function loadJobs() {
    try {
      const res = await fetchWithAuth("/admin/jobs");
      if (!res || !res.ok) {
        console.error("Failed to fetch jobs:", res ? res.status : "No response");
        return;
      }

      const jobs = await res.json();
      console.log("Jobs loaded:", jobs); // Debug log
      tableBody.innerHTML = "";

      if (jobs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No jobs found</td></tr>';
        return;
      }

      jobs.forEach(job => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${job.id}</td>
          <td>${job.title}</td>
          <td>${job.company}</td>
          <td><span class="status-${job.status}">${job.status}</span></td>
          <td>
            ${job.status === "pending" ? `<button class="btn approve-btn" data-id="${job.id}">Approve</button>` : ''}
            <button class="btn edit-btn" data-id="${job.id}">Edit</button>
            <button class="btn delete-btn" data-id="${job.id}" style="background-color:#ff4d4d">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      attachJobListeners();
    } catch (err) {
      console.error("Error loading jobs:", err);
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading jobs</td></tr>';
    }
  }

  // ================= Button Listeners =================
  function attachJobListeners() {
    document.querySelectorAll(".approve-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (confirm("Approve this job?")) {
          try {
            const res = await fetchWithAuth(`/admin/jobs/${id}/approve`, { method: "PUT" });
            if (res && res.ok) {
              alert("Job approved successfully");
              loadJobs();
            } else {
              alert("Failed to approve job");
            }
          } catch (err) { console.error(err); }
        }
      });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (confirm("Delete this job?")) {
          try {
            const res = await fetchWithAuth(`/admin/jobs/${id}`, { method: "DELETE" });
            if (res && res.ok) {
              alert("Job deleted successfully");
              loadJobs();
            } else {
              alert("Failed to delete job");
            }
          } catch (err) { console.error(err); }
        }
      });
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        await loadJobForEdit(e.target.dataset.id);
      });
    });
  }

  // ================= Modal Events =================
  document.querySelector(".close").addEventListener("click", closeEditModal);
  window.addEventListener("click", e => {
    if (e.target === document.getElementById("editModal")) closeEditModal();
  });
  document.getElementById("editJobForm").addEventListener("submit", handleEditSubmit);

  // ================= Initial Load =================
  loadJobs();
});