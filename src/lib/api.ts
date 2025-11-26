// src/lib/api.ts
import axios from "axios";
import { API_BASE_URL, getCookie } from "./axiosSetup";

// Shared Axios instance for all API calls
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach CSRF header for mutating requests (uses cookie primed in axiosSetup)
api.interceptors.request.use((config) => {
  const method = (config.method || "get").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrftoken = getCookie("csrftoken");
    if (csrftoken) {
      (config.headers as Record<string, string>)["X-CSRFToken"] = csrftoken;
    }
  }
  return config;
});

// Response interceptor to log 401s (session expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const errorMessage =
        error?.response?.data?.detail || "Authentication credentials were not provided";
      console.error("Authentication error:", errorMessage);
    }
    return Promise.reject(error);
  }
);