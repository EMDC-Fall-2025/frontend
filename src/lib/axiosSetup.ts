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
const CSRF_URL = `${API_BASE_URL}/api/auth/csrf/`;

axios.defaults.withCredentials = true;

// Prime the CSRF cookie once on app load (synchronous for reliability)
if (typeof window !== "undefined") {
  console.log("Starting CSRF fetch from:", CSRF_URL);
  fetch(CSRF_URL, {
    credentials: "include",
  })
    .then((response) => {
      console.log("CSRF fetch response status:", response.status);
      return response.json();
    })
    .then((data) => {
      console.log("CSRF response data:", data);
      if (data.csrfToken) {
        // Set the CSRF token cookie on the frontend domain for cross-domain access
        document.cookie = `csrftoken=${data.csrfToken}; path=/; domain=.emdcresults.com; secure; samesite=none`;
        console.log("CSRF cookie set, document.cookie:", document.cookie);
      } else {
        console.warn("No csrfToken in response");
      }
    })
    .catch((error) => {
      console.error("CSRF fetch failed:", error);
    });
}

api.interceptors.request.use((config) => {
  if (!config.headers) config.headers = new AxiosHeaders();
  const headers = config.headers as AxiosHeaders;

  // We rely on session cookies, not Authorization
  if (headers.has("Authorization")) headers.delete("Authorization");

  const method = (config.method || "get").toUpperCase();
  console.log("Axios interceptor for:", config.url, method);
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = getCookie("csrftoken");
    console.log("CSRF token from cookie:", csrf);
    if (csrf) {
      headers.set("X-CSRFToken", csrf);
      console.log("Set X-CSRFToken header:", csrf);
      console.log("Headers after CSRF set:", headers);
    } else {
      console.warn("No CSRF token found in cookie");
    }
  }

  return config;
});
