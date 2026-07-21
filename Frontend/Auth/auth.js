document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5001/api/auth";

  // Preserve redirect parameter when navigating to register
  const registerLink = document.getElementById("register-link");
  if (registerLink) {
    registerLink.addEventListener("click", (e) => {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get("redirect");
      if (redirectUrl) {
        e.preventDefault();
        window.location.href = `register.html?redirect=${encodeURIComponent(redirectUrl)}`;
      }
    });
  }

  // Preserve redirect parameter when navigating to login from register
  const loginLink = document.querySelector(".login-link a");
  if (loginLink) {
    loginLink.addEventListener("click", (e) => {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get("redirect");
      if (redirectUrl) {
        e.preventDefault();
        window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
      }
    });
  }

  const togglePassword = (checkboxId, inputId) => {
    const checkbox = document.getElementById(checkboxId);
    const input = document.getElementById(inputId);

    if (checkbox && input) {
      checkbox.addEventListener("change", () => {
        input.type = checkbox.checked ? "text" : "password";
      });
    }
  };

  togglePassword("showLoginPassword", "loginPassword");
  togglePassword("showRegisterPassword", "registerPassword");

  const loginForm = document.getElementById("loginSubmit");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const error = document.getElementById("loginError");
      const loading = document.getElementById("loginLoading");

      error.textContent = "";
      loading.textContent = "Loading...";
      const role = document.getElementById("LoginuserType").value;
      if (!role) {
  error.textContent = "Please select a user type.";
  loading.textContent = "";
  return;
}

      const formData = {
        email: loginForm.email.value.trim(),
        password: loginForm.password.value.trim(),
        role: role,
      };

      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        loading.textContent = "";

        if (!res.ok) throw new Error(data.error || "Login failed");

        // Save token & user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        error.style.color = "green";
        error.textContent = "Login successful! Redirecting...";

        // Check for redirect param
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get("redirect");

        if (redirectUrl) {
             setTimeout(() => window.location.href = decodeURIComponent(redirectUrl), 800);
             return;
        }

        const userRole = data.user.role;

        setTimeout(() => {
          if (userRole === 'admin') {
            window.location.href = "../Admin/dashboard.html";
          } else if (userRole === 'student') {
            window.location.href = "../Student/dashboard.html";
          } else if (userRole === 'recruiter') {
            window.location.href = "../Recruiter/dashboard.html";
          } else {
            alert("Invalid role returned from server!");
          }
        }, 800);
      } catch (err) {
        loading.textContent = "";
        error.style.color = "red";
        error.textContent = err.message;
      }
    });
  }

  const registerForm = document.getElementById("registerSubmit");

  if (registerForm) {
    // Real-time validation
    const emailInput = registerForm.email;
    const mobileInput = registerForm.mobile;
    const error = document.getElementById("registerError");

    // Email validation on blur
    emailInput.addEventListener("blur", async () => {
      const email = emailInput.value.trim();
      const emailHint = document.getElementById("emailHint");
      
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailHint.textContent = "Please enter a valid email format";
        emailHint.className = "validation-hint invalid";
      } else if (email) {
        emailHint.textContent = "Validating...";
        emailHint.className = "validation-hint";
        try {
          const res = await fetch(`${API_BASE}/check-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (!data.valid) {
            emailHint.textContent = data.message || "Invalid email address";
            emailHint.className = "validation-hint invalid";
          } else {
            emailHint.textContent = "Email is valid";
            emailHint.className = "validation-hint valid";
          }
        } catch (err) {
          emailHint.textContent = "";
          emailHint.className = "validation-hint";
        }
      } else {
        emailHint.textContent = "";
        emailHint.className = "validation-hint";
      }
    });

    // Phone validation on input
    mobileInput.addEventListener("input", () => {
      const mobile = mobileInput.value.trim();
      const mobileHint = document.getElementById("mobileHint");
      
      if (mobile && !/^[0][1][0-9]{0,9}$/.test(mobile)) {
        mobileHint.textContent = "Phone must be 11 digits starting with 01";
        mobileHint.className = "validation-hint invalid";
      } else if (mobile && mobile.length === 11) {
        mobileHint.textContent = "Phone number is valid";
        mobileHint.className = "validation-hint valid";
      } else {
        mobileHint.textContent = "";
        mobileHint.className = "validation-hint";
      }
    });

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const loading = document.getElementById("registerLoading");

      error.textContent = "";
      loading.textContent = "Loading...";
      error.style.color = "red";
      const role = document.getElementById("RegisterUsertype").value;
      if (!role) {
  error.textContent = "Please select a user type.";
  loading.textContent = "";
  return;
}

const formData = {
  username: registerForm.username.value.trim(),
  email: registerForm.email.value.trim(),
  mobile: registerForm.mobile.value.trim(),
  password: registerForm.password.value.trim(),
  role: role,
};


      try {
        const res = await fetch(`${API_BASE}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        loading.textContent = "";

        if (!res.ok) throw new Error(data.error || "Registration failed");

        // Save token & user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        error.style.color = "green";
        error.textContent = "Registration successful! Redirecting...";

        // Check for redirect param
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get("redirect");

        if (redirectUrl) {
             setTimeout(() => window.location.href = decodeURIComponent(redirectUrl), 900);
             return;
        }

        const userRole = formData.role;

        setTimeout(() => {
          if (userRole === 'admin') {
            window.location.href = "../Admin/dashboard.html";
          } else if (userRole === 'student') {
            window.location.href = "../Student/dashboard.html";
          } else if (userRole === 'recruiter') {
            window.location.href = "../Recruiter/dashboard.html";
          } else {
            alert("Invalid role returned from server!");
          }
        }, 900);
      } catch (err) {
        loading.textContent = "";
        error.style.color = "red";
        error.textContent = err.message;
      }
    });
  }
});
