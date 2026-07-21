// profile.js

document.addEventListener("DOMContentLoaded", async () => {
  // --- AUTH CHECK ---
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../Auth/login.html";
    return;
  }

  const logoutBtn = document.getElementById("logout-btn");
  const form = document.getElementById("profile-form");

  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const mobileInput = document.getElementById("mobile");
  const currentPasswordInput = document.getElementById("current_password");
  const newPasswordInput = document.getElementById("new_password");
  const confirmPasswordInput = document.getElementById("confirm_password");

  // --- LOGOUT HANDLER ---
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../Auth/login.html";
  });

  // --- NOTIFICATIONS (basic) ---
  const notifBtn = document.getElementById("notifBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  const notifList = document.getElementById("notifList");
  const notifCount = document.getElementById("notifCount");

  notifBtn.addEventListener("click", () => {
    notifDropdown.classList.toggle("show");
  });

  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) return;

      const data = await res.json();
      notifList.innerHTML = "";
      if (data.length === 0) {
        notifList.innerHTML = "<li>No notifications</li>";
      } else {
        data.forEach(notif => {
          const li = document.createElement("li");
          li.textContent = notif.message;
          notifList.appendChild(li);
        });
      }
      notifCount.textContent = data.length;
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  loadNotifications();

  // --- LOAD PROFILE ---
  async function loadProfile() {
    try {
      console.log("Loading admin profile...");
      console.log("Token:", token ? "exists" : "missing");
      console.log("Token value:", token.substring(0, 20) + "...");
      
      // Try with full URL first
      const API_BASE = "http://localhost:5001";
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: 'include'
      });

      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch profile: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log("Profile data:", data);
      
      if (!data.user) {
        throw new Error("No user data in response");
      }

      const admin = data.user;
      usernameInput.value = admin.username || "";
      emailInput.value = admin.email || "";
      mobileInput.value = admin.mobile || "";
      
      console.log("Profile loaded successfully");
    } catch (err) {
      console.error("Error loading profile:", err);
      
      // Try fallback with stored user data
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          console.log("Using stored user data:", user);
          usernameInput.value = user.username || "";
          emailInput.value = user.email || "";
          mobileInput.value = user.mobile || "";
          return;
        } catch (parseErr) {
          console.error("Failed to parse stored user data:", parseErr);
        }
      }
      
      alert(`Failed to load profile: ${err.message}`);
      // Set default values on error
      usernameInput.value = "";
      emailInput.value = "";
      mobileInput.value = "";
      usernameInput.placeholder = "Failed to load";
      emailInput.placeholder = "Failed to load";
      mobileInput.placeholder = "Failed to load";
    }
  }

  await loadProfile();

// --- PROFILE FORM SUBMIT ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate password fields if new password is provided
    if (newPasswordInput.value) {
      if (!currentPasswordInput.value) {
        alert("Current password is required to change password");
        return;
      }
      
      if (newPasswordInput.value !== confirmPasswordInput.value) {
        alert("New passwords do not match");
        return;
      }
    }

    // Prepare update data
    const updateData = {
      username: usernameInput.value,
      email: emailInput.value,
      mobile: mobileInput.value
    };

    // Only include password fields if new password is provided
    if (newPasswordInput.value) {
      updateData.password = newPasswordInput.value;
      updateData.currentPassword = currentPasswordInput.value;
    }

    try {
      console.log("Updating profile with data:", updateData);
      
      const API_BASE = "http://localhost:5001";
      const updateRes = await fetch(`${API_BASE}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      console.log("Update response status:", updateRes.status);

      if (updateRes.ok) {
        const data = await updateRes.json();
        console.log("Update response:", data);
        alert("Profile updated successfully");
        
        // Update stored user data
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        
        // Clear password fields
        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";
        
        // Reload profile to get updated data
        await loadProfile();
      } else {
        const err = await updateRes.json();
        console.error("Update error:", err);
        alert(err.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("An error occurred while updating profile");
    }
  });
});
