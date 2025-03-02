import axios from 'axios';

// Get the AI API URL from environment variable or use container name as fallback
const AI_API_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://ai_service:5001';

const aiApi = axios.create({
  baseURL: AI_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log the AI API URL for debugging
console.log('AI API URL:', AI_API_URL);

// Add response interceptor for handling errors
aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AI API Error:', error);
    return Promise.reject(error);
  }
);

// Add request interceptor
aiApi.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

export default aiApi;