import "../css/main.css";
import Alpine from "alpinejs";
import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "../components/shell/AppShell";

// Initialize Alpine.js for existing islands/modals if needed
window.Alpine = Alpine;
Alpine.start();

// ── Theme preference sync ─────────────────────────────────
(() => {
  function applyTheme(theme: string) {
    const resolved =
      theme === "system"
        ? window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
          ? "dark"
          : "light"
        : theme;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("theme-dark", resolved === "dark");
    root.classList.toggle("theme-light", resolved !== "dark");
  }

  const root = document.documentElement;
  const storedTheme = localStorage.getItem("feedee-theme");
  const initialTheme = storedTheme || root.dataset.theme || "system";
  applyTheme(initialTheme);

  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      if ((root.dataset.theme || "system") === "system") {
        applyTheme("system");
      }
    });
  }
})();

// ── Mount React AppShell (Claude Design 5a, 5b, 5c) ───────
document.addEventListener("DOMContentLoaded", () => {
  const mountEl = document.getElementById("feedee-app");
  if (!mountEl) return;

  let initialProps = {};
  if (mountEl.dataset.props) {
    try {
      initialProps = JSON.parse(mountEl.dataset.props);
    } catch (e) {
      console.error("Failed to parse #feedee-app data-props", e);
    }
  }

  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfMeta ? csrfMeta.getAttribute("content") : "";

  const root = createRoot(mountEl);
  root.render(
    <React.StrictMode>
      <AppShell {...initialProps} csrfToken={csrfToken || undefined} />
    </React.StrictMode>,
  );
});
