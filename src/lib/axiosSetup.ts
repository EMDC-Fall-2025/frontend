import axios, { AxiosHeaders } from "axios";
import { api, API_BASE_URL } from "./api";
import type { InternalAxiosRequestConfig } from "axios";

export function getCookie(name: string): string | null {
  const match = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
  return match ? decodeURIComponent(match[1]) : null;
}

// CSRF endpoint: /api/auth/csrf/
const CSRF_URL = `${API_BASE_URL}/api/auth/csrf/`;

axios.defaults.withCredentials = true;

// Prime the CSRF cookie once on app load (synchronous for reliability)
if (typeof window !== "undefined") {
  fetch(CSRF_URL, {
    credentials: "include",
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.csrfToken) {
        // Set the CSRF token cookie on the frontend domain for cross-domain access
        document.cookie = `csrftoken=${data.csrfToken}; path=/; domain=.emdcresults.com; secure; samesite=none`;
      } else {
        console.warn("No csrfToken in response");
      }
    })
    .catch((error) => {
      console.error("CSRF fetch failed:", error);
    });
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.headers) config.headers = new AxiosHeaders();
  const headers = config.headers as AxiosHeaders;

  // We rely on session cookies, not Authorization
  if (headers.has("Authorization")) headers.delete("Authorization");

  const method = (config.method || "get").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf) {
      headers.set("X-CSRFToken", csrf);
    } else {
      console.warn("No CSRF token found in cookie");
    }
  }

  return config;
});
