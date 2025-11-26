// api.ts
import axios from "axios";
import { API_BASE_URL } from "./axiosSetup";

export const api = axios.create({
  baseURL: API_BASE_URL,     
  withCredentials: true,
});

// Auth helpers
export function login(username: string, password: string) {
  return api.post("/auth/login/", { username, password });
}

export function logout() {
  return api.post("/auth/logout/");
}

export function getAllOrganizers() {
  return api.get("/organizer/getAll/");
}
