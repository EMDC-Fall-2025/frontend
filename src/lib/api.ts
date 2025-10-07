import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.DEV
    ? "/api" // dev:  Vite proxy forward /api → 127.0.0.1:7004
    : (import.meta.env.VITE_BACKEND_URL
        ? `${import.meta.env.VITE_BACKEND_URL}/api`
        : "/api"),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});