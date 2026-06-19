import axios from "axios";

export const API = import.meta.env.VITE_API_URL || "http://localhost:10000";

const apiClient = axios.create({
  baseURL: API,
});

apiClient.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("civicsense_token");
  const officerToken = localStorage.getItem("officerToken");
  const token = adminToken || officerToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Auth token rejected by server:", error.response.data);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
