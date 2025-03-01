import axios from 'axios';

// Set default base URL for all requests
axios.defaults.baseURL = 'http://localhost:5000';

// Set or remove x-auth-token in request headers
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
    localStorage.removeItem('token');
  }
};