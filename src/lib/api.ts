// src/lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.DEV ? "/api"
    : (import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : "/api"),
  withCredentials: true, // keep if you use session cookies
});
