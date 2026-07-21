document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5001/api/auth";
  const resetForm = document.getElementById("resetForm");

  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = resetForm.email.value.trim();
    const error = document.getElementById("resetError");
    const loading = document.getElementById("resetLoading");

    error.textContent = "";
    loading.textContent = "Sending reset code...";

    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      loading.textContent = "";

      if (!res.ok) throw new Error(data.error || "Failed to send reset code");

      error.style.color = "green";
      error.textContent = data.message || "Reset code sent to your email!";
    } catch (err) {
      loading.textContent = "";
      error.style.color = "red";
      error.textContent = err.message;
    }
  });
});
