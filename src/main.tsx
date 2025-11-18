import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import "./lib/axiosSetup";
import heroImage from "./assets/group.png";

// Preload hero image using the actual bundled URL so it stays cached across navigations
if (typeof document !== "undefined") {
  const existing = document.head.querySelector<HTMLLinkElement>(
    `link[rel="preload"][href="${heroImage}"]`
  );

  if (!existing) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = heroImage;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
  }

  // Warm the cache proactively
  const img = new Image();
  img.src = heroImage;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
