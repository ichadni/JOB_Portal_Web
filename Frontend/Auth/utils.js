// utils.js

// API base URL
const API_BASE = (function () {
  return window.API_BASE || (location.origin.includes('file:') ? 'http://localhost:5000' : location.origin + '/api');
})();

// Escape HTML to prevent XSS
function escapeHTML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Set auth UI (login/logout nav links)
function setAuthUI() {
  const link = document.getElementById('auth-link');
  if (!link) return;

  const token = localStorage.getItem('token');
  if (token) {
    const userJson = localStorage.getItem('user');
    const name = userJson ? escapeHTML(JSON.parse(userJson).username) : 'Account';

    link.textContent = `Hi, ${name}`;
    link.href = '#';

    // Remove old listeners and add logout
    const newLink = link.cloneNode(true);
    link.replaceWith(newLink);

    newLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.reload();
      }
    });
  } else {
    link.textContent = 'Login';

   link.href = '/Auth/Login.html';

}

document.addEventListener('DOMContentLoaded', setAuthUI);
}