
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeTheme, setupThemeListener } from "./utils/themeUtils";

// Initialize theme on app load
initializeTheme();

// Set up theme listener for cross-tab synchronization
setupThemeListener();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
