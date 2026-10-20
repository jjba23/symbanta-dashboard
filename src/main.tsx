/* symbanta-dashboard
 *
 * Copyright © Josep Bigorra <jjbigorra@gmail.com>
 *
 * symbanta-dashboard is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * symbanta-dashboard is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with symbanta-dashboard.  If not, see <https://www.gnu.org/licenses/>.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

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

applyInitialTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
