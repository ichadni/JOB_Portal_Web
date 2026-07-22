document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5001/api/auth";
  
  // Get all elements
  const emailInput = document.getElementById("resetEmail");
  const sendCodeBtn = document.getElementById("sendResetCodeBtn");
  const codeInput = document.getElementById("resetCode");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const resetPasswordBtn = document.getElementById("resetPasswordBtn");
  const errorDiv = document.getElementById("resetError");
  const loadingDiv = document.getElementById("resetLoading");
  
  // Initially hide code and password sections
  const codeSection = document.getElementById("codeSection");
  const passwordSection = document.getElementById("passwordSection");
  if (codeSection) codeSection.style.display = "none";
  if (passwordSection) passwordSection.style.display = "none";
  
  let userEmail = "";

  // ============================================
  // STEP 1: Send Reset Code
  // ============================================
  sendCodeBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    
    // Validate email
    if (!email) {
      errorDiv.textContent = "Please enter your email address";
      errorDiv.style.color = "red";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorDiv.textContent = "Please enter a valid email address";
      errorDiv.style.color = "red";
      return;
    }

    // Show loading
    loadingDiv.textContent = "Sending reset code...";
    errorDiv.textContent = "";

    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset code");
      }

      // Success - save email and show next sections
      userEmail = email;
      
      // Show code and password sections
      if (codeSection) codeSection.style.display = "block";
      if (passwordSection) passwordSection.style.display = "block";
      
      // Disable send button
      sendCodeBtn.disabled = true;
      sendCodeBtn.textContent = "✅ Code Sent";
      sendCodeBtn.style.opacity = "0.6";
      
      loadingDiv.textContent = "";
      errorDiv.textContent = "✅ Reset code sent to your email!";
      errorDiv.style.color = "green";

    } catch (err) {
      loadingDiv.textContent = "";
      errorDiv.textContent = err.message;
      errorDiv.style.color = "red";
    }
  });

  // ============================================
  // STEP 2: Reset Password with Code
  // ============================================
  resetPasswordBtn.addEventListener("click", async () => {
    const code = codeInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    // Clear previous errors
    errorDiv.textContent = "";

    // Validate code
    if (!code) {
      errorDiv.textContent = "Please enter the reset code from your email";
      errorDiv.style.color = "red";
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      errorDiv.textContent = "Please enter a valid 6-digit code";
      errorDiv.style.color = "red";
      return;
    }

    // Validate password
    if (newPassword.length < 6) {
      errorDiv.textContent = "Password must be at least 6 characters long";
      errorDiv.style.color = "red";
      return;
    }

    if (newPassword !== confirmPassword) {
      errorDiv.textContent = "Passwords do not match";
      errorDiv.style.color = "red";
      return;
    }

    // Show loading
    loadingDiv.textContent = "Resetting password...";
    errorDiv.textContent = "";

    try {
      const response = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: userEmail,
          code: code,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      // Success
      loadingDiv.textContent = "";
      errorDiv.textContent = "✅ Password reset successful! Redirecting to login...";
      errorDiv.style.color = "green";

      // Disable reset button
      resetPasswordBtn.disabled = true;
      resetPasswordBtn.textContent = "✅ Reset Complete";

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

    } catch (err) {
      loadingDiv.textContent = "";
      errorDiv.textContent = err.message;
      errorDiv.style.color = "red";
    }
  });

  // ============================================
  // Allow Enter key to trigger buttons
  // ============================================
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const active = document.activeElement;
      
      if (active === emailInput) {
        e.preventDefault();
        sendCodeBtn.click();
      } else if (active === codeInput || active === newPasswordInput || active === confirmPasswordInput) {
        e.preventDefault();
        resetPasswordBtn.click();
      }
    }
  });
});