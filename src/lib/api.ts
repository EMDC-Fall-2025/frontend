// api.ts
import axios from "axios";

const BACKEND_ORIGIN =
  (import.meta as any).env?.VITE_BACKEND_URL || "https://api.emdcresults.com";

// API calls include /api/ prefix
export const API_BASE_URL = BACKEND_ORIGIN;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Auth helpers
export function login(username: string, password: string) {
  return api.post("/api/login/", { username, password });
}

export function logout() {
  return api.post("/api/logout/");
}

export function getAllOrganizers() {
  return api.get("/organizer/getAll/");
}
