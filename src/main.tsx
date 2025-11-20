import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import "./lib/axiosSetup";
import heroImage from "./assets/group.webp";

if (typeof document !== "undefined") {
  const preloadLink = document.createElement("link");
  preloadLink.rel = "preload";
  preloadLink.as = "image";
  preloadLink.href = heroImage;
  preloadLink.setAttribute("fetchpriority", "high");
  document.head.appendChild(preloadLink);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
