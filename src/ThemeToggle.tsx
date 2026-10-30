// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useTheme } from "./ThemeContext";
import { useI18n } from "./i18n/I18nContext.tsx";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useI18n();

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  const label = resolvedTheme === "dark" ? t("Switch to light mode") : t("Switch to dark mode");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="glass-control inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-stone-700 transition-[background,box-shadow] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:text-stone-200"
      title={t("Current mode: {mode}", { mode: theme })}
      aria-label={label}
    >
      {resolvedTheme === "dark" ? (
        /* Sun Icon */
        <svg
          className="h-4.5 w-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        /* Moon Icon */
        <svg
          className="h-4.5 w-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
