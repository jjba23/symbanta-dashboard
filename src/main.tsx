// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { preferredLocale } from "./i18n/locale.ts";

/**
 * Apply the persisted theme before the first paint to avoid a flash of the
 * wrong colour scheme. The theme is stored in the `symbanta_theme` cookie
 * (source of truth for `ThemeProvider`) with `localStorage` as a fallback.
 */
function applyInitialTheme(): void {
  const cookieMatch = document.cookie.match(/(?:^| )symbanta_theme=([^;]+)/);
  const cookieTheme = cookieMatch?.[1] ? decodeURIComponent(cookieMatch[1]) : null;
  const storedTheme = cookieTheme ?? localStorage.getItem("theme");
  const theme =
    storedTheme && ["light", "dark", "system"].includes(storedTheme) ? storedTheme : "system";

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

/**
 * Set `<html lang>` before the first paint as well, so screen readers start
 * with the right pronunciation instead of switching mid-announcement.
 */
function applyInitialLocale(): void {
  const cookieMatch = document.cookie.match(/(?:^| )symbanta_locale=([^;]+)/);
  const cookieLocale = cookieMatch?.[1] ? decodeURIComponent(cookieMatch[1]) : "";
  const locale = preferredLocale({
    cookie: cookieLocale,
    stored: localStorage.getItem("locale"),
    navigatorLanguages: [...(navigator.languages ?? []), navigator.language],
  });

  document.documentElement.lang = locale;
}

applyInitialTheme();
applyInitialLocale();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
