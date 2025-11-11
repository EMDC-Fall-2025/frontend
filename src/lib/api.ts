// src/lib/api.ts
import axios from "axios";

function getCookie(name: string): string | null {
  const m = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
  return m ? decodeURIComponent(m[1]) : null;
}

export const api = axios.create({
  baseURL: "",     
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const method = (config.method || "get").toUpperCase();
  if (["POST","PUT","PATCH","DELETE"].includes(method)) {
    const csrftoken = getCookie("csrftoken");
    if (csrftoken) (config.headers as Record<string,string>)["X-CSRFToken"] = csrftoken;
  }
  return config;
});
