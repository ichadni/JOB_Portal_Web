// Mock localStorage for Node.js testing
global.localStorage = {
  data: {},
  setItem: function(key, value) { this.data[key] = value; },
  getItem: function(key) { return this.data[key] || null; },
  removeItem: function(key) { delete this.data[key]; }
};

// Mock fetch for Node.js
global.fetch = async (url, options) => {
  const axios = require('axios');
  
  try {
    // Convert fetch options to axios format
    const axiosConfig = {
      method: options.method || 'GET',
      url: url,
      headers: options.headers || {},
      data: options.body ? JSON.parse(options.body) : undefined
    };
    
    const response = await axios(axiosConfig);
    
    return {
      status: response.status,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data)
    };
  } catch (error) {
    throw error;
  }
};

// Now load and run the test
require('./test-dashboard-api.js');