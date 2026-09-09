// utils.js

function getStoredUser() {
  const rawUser = localStorage.getItem('user');
  if (!rawUser || rawUser === 'undefined' || rawUser === 'null') return null;

  try {
    const parsedUser = JSON.parse(rawUser);
    return parsedUser && typeof parsedUser === 'object' ? parsedUser : null;
  } catch (error) {
    console.warn('Invalid user data found in localStorage. Clearing it.');
    localStorage.removeItem('user');
    return null;
  }
}

// API base URL
const API_BASE = (function () {
  return window.API_BASE || location.origin + '/api';
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
    const user = getStoredUser();
    const name = user ? escapeHTML(user.username) : 'Account';

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