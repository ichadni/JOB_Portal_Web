document.addEventListener("DOMContentLoaded", async () => {
  checkAdminAuth();

  // ====================== Notifications ======================
  const notifBtn = document.getElementById("notifBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  const notifList = document.getElementById("notifList");
  const notifCount = document.getElementById("notifCount");

  notifBtn.addEventListener("click", () => {
    notifDropdown.style.display =
      notifDropdown.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
      notifDropdown.style.display = "none";
    }
  });

  try {
    

    
    const usersRes = await fetchWithAuth("/admin/users/stats");
    if (usersRes) {
      const data = await usersRes.json();
      document.querySelector("#totalUsersCard p").textContent = data.totalUsers;
    }

    
    const jobsRes = await fetchWithAuth("/admin/jobs/stats");
    if (jobsRes) {
      const data = await jobsRes.json();
      document.querySelector("#totalJobsCard p").textContent = data.totalJobs;
    }

    // 3. Pending Job Approvals
    const pendingRes = await fetchWithAuth("/admin/jobs/pending");
    if (pendingRes) {
      const data = await pendingRes.json();
      document.querySelector("#pendingJobsCard p").textContent = data.pendingCount;
    }

    // 4. Recent Registrations
    const recentRes = await fetchWithAuth("/admin/users/recent");
    if (recentRes) {
      const data = await recentRes.json();
      document.querySelector("#recentRegistrationsCard p").textContent = data.recentCount;
    }

    // ====================== Recent Job Postings ======================
    const recentJobRes = await fetchWithAuth("/admin/jobs/recent");
    if (recentJobRes) {
      const data = await recentJobRes.json();
      const recentJobs = document.getElementById("recentJobs");
      recentJobs.innerHTML = "";

      if (!data.jobs || data.jobs.length === 0) {
        recentJobs.innerHTML = "<li>No recent jobs</li>";
      } else {
        data.jobs.forEach(job => {
          const li = document.createElement("li");
          li.textContent = `${job.title} - ${job.company}`;
          li.style.cursor = "pointer";
          li.addEventListener("click", () => {
            window.location.href = `jobDetails.html?id=${job.id}`;
          });
          recentJobs.appendChild(li);
        });
      }
    }

    // ====================== User Status Stats ======================
    const userStatusRes = await fetchWithAuth("/admin/users/status");
    if (userStatusRes) {
      const data = await userStatusRes.json();
      document.querySelector("#userStatus").textContent = `Active: ${data.active}, Inactive: ${data.inactive}`;
    }

    // ====================== Notifications ======================
    const notifRes = await fetchWithAuth("/admin/notifications");
    if (notifRes) {
      const data = await notifRes.json();
      notifCount.textContent = data.count || 0;

      notifList.innerHTML = "";

      if (!data.list || data.list.length === 0) {
        notifList.innerHTML = "<li>No notifications</li>";
      } else {
        data.list.forEach(n => {
          const li = document.createElement("li");
          li.textContent = n.message;
          notifList.appendChild(li);
        });
      }
    }

    // ====================== Clickable Cards ======================
    document.getElementById("totalJobsCard").addEventListener("click", () => {
      window.location.href = "jobs.html";
    });
    document.getElementById("totalUsersCard").addEventListener("click", () => {
      window.location.href = "user.html";
    });

    document.getElementById("pendingJobsCard").addEventListener("click", () => {
      window.location.href = "jobs.html?filter=pending";
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
  }

  document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/Frontend/Auth/Login.html";
  });
});

