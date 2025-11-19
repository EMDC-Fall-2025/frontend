import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import "./lib/axiosSetup";
import heroImage from "./assets/group.png";

if (typeof document !== "undefined") {
  const cacheKey = `heroImageCached_${heroImage}`;
  const isCached = sessionStorage.getItem(cacheKey);

  if (!isCached) {
    // Preload with high priority for immediate loading
    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "image";
    preloadLink.href = heroImage;
    preloadLink.setAttribute("fetchpriority", "high");
    document.head.appendChild(preloadLink);

    // Warm the cache with multiple strategies
    const img = new Image();
    img.src = heroImage;
    img.loading = "eager";
    img.decoding = "sync";

    // Also prefetch for future navigations 
    const prefetchLink = document.createElement("link");
    prefetchLink.rel = "prefetch";
    prefetchLink.href = heroImage;
    prefetchLink.as = "image";
    document.head.appendChild(prefetchLink);

    // Mark as cached to avoid repeated preloading
    img.onload = () => {
      sessionStorage.setItem(cacheKey, 'true');
    };

    // Fallback: mark as cached after a timeout in case onload doesn't fire
    setTimeout(() => {
      if (!sessionStorage.getItem(cacheKey)) {
        sessionStorage.setItem(cacheKey, 'true');
      }
    }, 2000);
  } else {
    // Image is cached, still preload for immediate availability
    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "image";
    preloadLink.href = heroImage;
    preloadLink.setAttribute("fetchpriority", "high");
    document.head.appendChild(preloadLink);
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
