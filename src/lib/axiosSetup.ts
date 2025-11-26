import axios, { AxiosHeaders } from "axios";

export function getCookie(name: string): string | null {
  const match = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
  return match ? decodeURIComponent(match[1]) : null;
}

// VITE_BACKEND_URL should be just the origin, no /api suffix
const BACKEND_ORIGIN =
  (import.meta as any).env?.VITE_BACKEND_URL || "https://api.emdcresults.com";

// API calls include /api/ prefix
export const API_BASE_URL = BACKEND_ORIGIN;

// CSRF endpoint: /api/auth/csrf/
const CSRF_URL = `${API_BASE_URL}/auth/csrf/`;

axios.defaults.withCredentials = true;

// Prime the CSRF cookie once
if (typeof window !== "undefined") {
  const fetchCSRF = () => {
    fetch(CSRF_URL, {
      credentials: "include",
    }).catch(() => {
      // ignore errors
    });
  };

  if (window.requestIdleCallback) {
    window.requestIdleCallback(fetchCSRF, { timeout: 2000 });
  } else {
    setTimeout(fetchCSRF, 0);
  }
}

axios.interceptors.request.use((config) => {
  if (!config.headers) config.headers = new AxiosHeaders();
  const headers = config.headers as AxiosHeaders;

  // We rely on session cookies, not Authorization
  if (headers.has("Authorization")) headers.delete("Authorization");

  const method = (config.method || "get").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf) {
      headers.set("X-CSRFToken", csrf);
    }
  }

  return config;
});
