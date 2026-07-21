// Base URL for backend API
const API_BASE = "http://localhost:5001";

// Get form elements
const profileForm = document.getElementById("profile-form");

// Load profile info on page load
async function loadProfile() {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not logged in");

    const res = await fetch(`${API_BASE}/api/student/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const user = await res.json();
    if (!res.ok) throw new Error(user.error || "Failed to load profile");

    // Fill input fields using IDs
    document.getElementById("usernameInput").value = user.username || "";
    document.getElementById("emailInput").value = user.email || "";
    document.getElementById("mobileInput").value = user.mobile || "";
    document.getElementById("fullNameInput").value = user.full_name || "";
    document.getElementById("skillsInput").value = user.skills || "";

  } catch (err) {
    console.error(err);
    alert(err.message);
    // Redirect to login page if user is not logged in
    if (err.message === "User not logged in") {
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = `../Auth/Login.html?redirect=${currentUrl}`;
    }
  }
}

loadProfile();

// Handle profile update form submission
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    alert("User not logged in");
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `../Auth/Login.html?redirect=${currentUrl}`;
    return;
  }

  // Get input values
  const username = document.getElementById("usernameInput").value;
  const email = document.getElementById("emailInput").value;
  const mobile = document.getElementById("mobileInput").value;
  const fullName = document.getElementById("fullNameInput").value;
  const skills = document.getElementById("skillsInput").value;
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  try {
    // Update basic profile info
    let res = await fetch(`${API_BASE}/api/student/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ username, email, mobile, full_name: fullName, skills })
    });

    let data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update profile");

    // Update password if user filled the fields
    if (currentPassword || newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match");
        return;
      }

      res = await fetch(`${API_BASE}/api/student/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });

      data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      alert(data.message || "Password updated successfully");
    }

    alert("Profile updated successfully");

    // Clear password fields
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// Update skills function
async function updateSkills() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("User not logged in");
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = `../Auth/Login.html?redirect=${currentUrl}`;
      return;
    }

    const skills = document.getElementById("skillsInput").value;

    const res = await fetch(`${API_BASE}/api/student/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ skills })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update skills");

    alert("Skills updated successfully");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

// Handle password form submission
const passwordForm = document.getElementById("password-form");
if (passwordForm) {
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("User not logged in");
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = `../Auth/Login.html?redirect=${currentUrl}`;
      return;
    }

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/student/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      alert("Password updated successfully");

      // Clear password fields
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";

  } catch (err) {
    console.error(err);
    alert(err.message);
    // Redirect to login page if user is not logged in
    if (err.message === "User not logged in") {
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = `../Auth/Login.html?redirect=${currentUrl}`;
    }
  }
  });
}

// Logout function
document.getElementById("logout").addEventListener("click", async () => {
  try {
    const token = localStorage.getItem("token");
    
    if (token) {
      // Call logout endpoint if available
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
      } catch (err) {
        console.log("Logout endpoint not available, clearing local storage");
      }
    }

    // Clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Redirect to login page
    window.location.href = "../Auth/Login.html";
  } catch (err) {
    console.error(err);
    // Still redirect even if logout API fails
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "../Auth/Login.html";
  }
});
