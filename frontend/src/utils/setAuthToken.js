import axios from "axios";

// NOTE: We're using the proxy in package.json, so we don't need to set baseURL
// If we're running in development, React will proxy requests to http://localhost:5000

// Set or remove x-auth-token in request headers
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["x-auth-token"] = token;
    localStorage.setItem("token", token);
  } else {
    delete axios.defaults.headers.common["x-auth-token"];
    localStorage.removeItem("token");
  }
};
