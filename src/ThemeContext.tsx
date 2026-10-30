// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCookie, setCookie } from "./Prelude.ts";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const THEME_COOKIE_KEY = "symbanta_theme";

const ThemeContext: React.Context<ThemeContextType | undefined> = createContext<
  ThemeContextType | undefined
>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const themes: Theme[] = ["light", "dark", "system"];
    const cookieTheme = getCookie(THEME_COOKIE_KEY) as Theme;
    if (themes.includes(cookieTheme)) {
      return cookieTheme;
    }
    const storedTheme = localStorage.getItem("theme") as Theme;
    return themes.includes(storedTheme) ? storedTheme : "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    setCookie(THEME_COOKIE_KEY, newTheme);
  };

  // @ts-ignore
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
      const isDark = theme === "dark" || (theme === "system" && mediaQuery.matches);

      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
      setResolvedTheme(isDark ? "dark" : "light");
    };

    updateTheme();

    if (theme === "system") {
      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
