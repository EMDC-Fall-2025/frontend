import axios, { AxiosHeaders } from "axios";

function getCookie(name: string): string | null {
  const match = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
  return match ? decodeURIComponent(match[1]) : null;
}

axios.defaults.withCredentials = true;

// Prime the CSRF cookie once in the browser so subsequent POSTs succeed
// Use requestIdleCallback for non-blocking initialization
if (typeof window !== "undefined") {
  const fetchCSRF = () => {
    // Hit the Render backend directly so CSRFTOKEN comes from the API host
    fetch("https://emdc-backend.onrender.com/api/auth/csrf/", {
      credentials: "include",
    }).catch(() => {
      // ignore — login/signup will retry automatically if needed
    });
  };
  
  // Use requestIdleCallback if available (non-blocking), otherwise setTimeout
  if (window.requestIdleCallback) {
    window.requestIdleCallback(fetchCSRF, { timeout: 2000 });
  } else {
    setTimeout(fetchCSRF, 0);
  }
}

axios.interceptors.request.use((config) => {
  // Remove any stale Authorization header; rely on session cookie instead
  if (!config.headers) config.headers = new AxiosHeaders();
  const headers = config.headers as AxiosHeaders;
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


