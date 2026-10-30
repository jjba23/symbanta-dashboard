// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getCookie, setCookie } from "./Prelude.ts";
import { setPrefersDark } from "./test/matchMedia.ts";
import { ThemeProvider, useTheme } from "./ThemeContext.tsx";

const THEME_COOKIE = "symbanta_theme";

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        Dark
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        Light
      </button>
      <button type="button" onClick={() => setTheme("system")}>
        System
      </button>
    </div>
  );
}

function renderThemed() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

describe("ThemeProvider", () => {
  it("defaults to the system theme", () => {
    renderThemed();

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("follows the OS preference in system mode", () => {
    setPrefersDark(true);
    renderThemed();

    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("reacts when the OS preference changes", () => {
    renderThemed();

    act(() => setPrefersDark(true));

    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");

    act(() => setPrefersDark(false));

    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("restores the theme from the cookie", () => {
    setCookie(THEME_COOKIE, "dark");
    renderThemed();

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("prefers the cookie over the localStorage fallback", () => {
    localStorage.setItem("theme", "light");
    setCookie(THEME_COOKIE, "dark");
    renderThemed();

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("falls back to localStorage when no cookie is set", () => {
    localStorage.setItem("theme", "dark");
    renderThemed();

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem("theme", "neon");
    setCookie(THEME_COOKIE, "neon");
    renderThemed();

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
  });

  it("applies and persists an explicit theme", async () => {
    const user = userEvent.setup();
    renderThemed();

    await user.click(screen.getByRole("button", { name: "Dark" }));

    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(getCookie(THEME_COOKIE)).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Light" }));

    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(getCookie(THEME_COOKIE)).toBe("light");
  });

  it("returns to system mode on request", async () => {
    const user = userEvent.setup();
    setPrefersDark(true);
    renderThemed();

    await user.click(screen.getByRole("button", { name: "Light" }));
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");

    await user.click(screen.getByRole("button", { name: "System" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("throws a helpful error when used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<ThemeProbe />)).toThrow("useTheme must be used within a ThemeProvider");
  });
});
