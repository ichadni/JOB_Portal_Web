// users.js
document.addEventListener("DOMContentLoaded", async () => {
  checkAdminAuth();

  const tableBody = document.querySelector("tbody");
  const logoutBtn = document.getElementById("logout-btn");
  const notifBtn = document.getElementById("notifBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  const notifList = document.getElementById("notifList");
  const notifCount = document.getElementById("notifCount");

  // --- LOGOUT ---
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../Auth/login.html";
  });

  // --- NOTIFICATIONS ---
  notifBtn.addEventListener("click", () => {
    notifDropdown.classList.toggle("show");
  });

  async function loadNotifications() {
    try {
      const res = await fetchWithAuth("/admin/notifications");
      if (!res) return;

      const data = await res.json();
      notifList.innerHTML = "";

      if (!data.list || data.list.length === 0) {
        notifList.innerHTML = "<li>No notifications</li>";
      } else {
        data.list.forEach(notif => {
          const li = document.createElement("li");
          li.textContent = notif.message;
          notifList.appendChild(li);
        });
      }
      notifCount.textContent = data.count || 0;
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  loadNotifications();

  // --- LOAD USERS ---
  async function loadUsers() {
    try {
      const res = await fetchWithAuth("/admin/users");
      if (!res) return;
      if (!res.ok) throw new Error("Failed to fetch users");
      const users = await res.json();

      tableBody.innerHTML = "";

      users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.id}</td>
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>${user.mobile || "N/A"}</td>
          <td>${user.role}</td>
          <td>
            <button class="btn edit-btn" data-id="${user.id}" data-username="${user.username}" data-email="${user.email}" data-mobile="${user.mobile || ''}" data-role="${user.role}">Edit</button>
            <button class="btn delete-btn" data-id="${user.id}" style="background-color:#ff4d4d">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      // --- DELETE USER ---
      document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.getAttribute("data-id");
          if (confirm("Are you sure you want to delete this user?")) {
            await deleteUser(id);
          }
        });
      });

      // --- EDIT USER ---
      document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.target.getAttribute("data-id");
          const username = e.target.getAttribute("data-username");
          const email = e.target.getAttribute("data-email");
          const mobile = e.target.getAttribute("data-mobile");
          const role = e.target.getAttribute("data-role");
          openEditModal(id, username, email, mobile, role);
        });
      });

    } catch (err) {
      console.error("Error loading users:", err);
      tableBody.innerHTML = "<tr><td colspan='6'>Failed to load users</td></tr>";
    }
  }

  async function deleteUser(id) {
    try {
      const res = await fetchWithAuth(`/admin/users/${id}`, {
        method: "DELETE"
      });
      if (!res) return;
      if (res.ok) {
        alert("User deleted successfully");
        loadUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Error deleting user");
    }
  }

  // --- MODAL FUNCTIONS ---
  function openEditModal(id, username, email, mobile, role) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "block";
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Edit User</h2>
        <form id="edit-user-form">
          <input type="hidden" id="edit-user-id" value="${id}">
          <label>Username:</label>
          <input type="text" id="edit-username" value="${username}" required>
          
          <label>Email:</label>
          <input type="email" id="edit-email" value="${email}" required>
          
          <label>Mobile:</label>
          <input type="text" id="edit-mobile" value="${mobile}">
          
          <label>Role:</label>
          <select id="edit-role">
            <option value="student" ${role === 'student' ? 'selected' : ''}>Student</option>
            <option value="recruiter" ${role === 'recruiter' ? 'selected' : ''}>Recruiter</option>
            <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
          
          <button type="submit" class="btn">Update User</button>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector(".close").onclick = () => document.body.removeChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    };
    
    // Handle form submission
    modal.querySelector("#edit-user-form").onsubmit = async (e) => {
      e.preventDefault();
      await updateUser(
        document.getElementById("edit-user-id").value,
        document.getElementById("edit-username").value,
        document.getElementById("edit-email").value,
        document.getElementById("edit-mobile").value,
        document.getElementById("edit-role").value
      );
      document.body.removeChild(modal);
    };
  }
  
  function openAddModal() {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "block";
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Add New User</h2>
        <form id="add-user-form">
          <label>Username:</label>
          <input type="text" id="add-username" required>
          
          <label>Email:</label>
          <input type="email" id="add-email" required>
          
          <label>Mobile:</label>
          <input type="text" id="add-mobile" required>
          
          <label>Password:</label>
          <input type="password" id="add-password" required>
          
          <label>Role:</label>
          <select id="add-role">
            <option value="student">Student</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          
          <button type="submit" class="btn">Create User</button>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector(".close").onclick = () => document.body.removeChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    };
    
    // Handle form submission
    modal.querySelector("#add-user-form").onsubmit = async (e) => {
      e.preventDefault();
      await createUser(
        document.getElementById("add-username").value,
        document.getElementById("add-email").value,
        document.getElementById("add-mobile").value,
        document.getElementById("add-password").value,
        document.getElementById("add-role").value
      );
      document.body.removeChild(modal);
    };
  }
  
  async function updateUser(id, username, email, mobile, role) {
    try {
      const res = await fetchWithAuth(`/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ username, email, mobile, role })
      });
      if (!res) return;
      
      if (res.ok) {
        alert("User updated successfully");
        loadUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update user");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Error updating user");
    }
  }
  
  async function createUser(username, email, mobile, password, role) {
    try {
      const res = await fetchWithAuth("/admin/users", {
        method: "POST",
        body: JSON.stringify({ username, email, mobile, password, role })
      });
      if (!res) return;
      
      if (res.ok) {
        alert("User created successfully");
        loadUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create user");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      alert("Error creating user");
    }
  }
  
  // Add event listener for Add New User button
  const addUserBtn = document.getElementById("add-user-btn");
  if (addUserBtn) {
    addUserBtn.addEventListener("click", openAddModal);
  }

  loadUsers();
});
