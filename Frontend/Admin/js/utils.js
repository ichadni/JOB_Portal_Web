const API_URL = "http://localhost:5001";

function getToken() {
  return localStorage.getItem("token");
}

function checkAdminAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "../Auth/login.html"; // Adjust path relative to your page
    return null;
  }
  return token;
}

async function fetchWithAuth(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    alert("Session expired or unauthorized. Please login again.");
    localStorage.removeItem("token");
    window.location.href = "../Auth/login.html";
    return null;
  }

  return response;
}

// Export globally
window.API_URL = API_URL;
window.getToken = getToken;
window.checkAdminAuth = checkAdminAuth;
window.fetchWithAuth = fetchWithAuth;