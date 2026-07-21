// Common authentication helper for admin panel
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = '../../Auth/Login.html';
    return null;
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(`http://localhost:5001/api${url}`, finalOptions);
    
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '../../Auth/Login.html';
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

async function checkAdminAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../../Auth/Login.html';
    return false;
  }
  
  try {
    // Verify token and check if user is admin
    const response = await fetchWithAuth('/auth/me');
    if (!response || !response.ok) {
      localStorage.removeItem('token');
      window.location.href = '../../Auth/Login.html';
      return false;
    }
    
    const data = await response.json();
    if (data.user.role !== 'admin') {
      localStorage.removeItem('token');
      window.location.href = '../../Auth/Login.html';
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    localStorage.removeItem('token');
    window.location.href = '../../Auth/Login.html';
    return false;
  }
}