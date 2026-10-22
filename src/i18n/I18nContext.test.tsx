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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getCookie, setCookie } from "../Prelude.ts";
import { I18nProvider, LOCALE_COOKIE_KEY, LOCALE_STORAGE_KEY, useI18n } from "./I18nContext.tsx";
import { LocaleSwitcher } from "./LocaleSwitcher.tsx";

function Probe() {
  const { locale, t, setLocale } = useI18n();

  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="translated">{t("Language")}</span>
      <span data-testid="missing">{t("Not in any catalog")}</span>
      <LocaleSwitcher />
      <button type="button" onClick={() => setLocale("es")}>
        switch-to-es
      </button>
      <button type="button" onClick={() => setLocale("xx")}>
        switch-to-xx
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  );
}

describe("I18nProvider", () => {
  it("starts in English when nothing is stored", () => {
    renderProbe();

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("translated")).toHaveTextContent("Language");
    expect(document.documentElement.lang).toBe("en");
  });

  it("offers every supported language in the switcher", () => {
    renderProbe();

    const options = Array.from(
      screen.getByRole("combobox", { name: "Language" }).querySelectorAll("option"),
    ).map((option) => option.textContent);

    expect(options).toEqual([
      "English",
      "Deutsch",
      "Español",
      "Français",
      "Italiano",
      "日本語",
      "Nederlands",
      "Português",
    ]);
    expect(screen.getByRole("option", { name: "Español" }).closest("select")).toHaveValue("en");
  });

  it("restores the language from the cookie", () => {
    setCookie(LOCALE_COOKIE_KEY, "es");

    renderProbe();

    expect(screen.getByTestId("locale")).toHaveTextContent("es");
    expect(screen.getByTestId("translated")).toHaveTextContent("Idioma");
    expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveValue("es");
    expect(document.documentElement.lang).toBe("es");
  });

  it("restores the language from localStorage", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "es");

    renderProbe();

    expect(screen.getByTestId("locale")).toHaveTextContent("es");
  });

  it("ignores stored languages without a catalog", () => {
    setCookie(LOCALE_COOKIE_KEY, "sv");

    renderProbe();

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });

  it("uses the browser preference list when nothing is stored", () => {
    vi.spyOn(Navigator.prototype, "languages", "get").mockReturnValue(["es-ES", "en-US"]);
    vi.spyOn(Navigator.prototype, "language", "get").mockReturnValue("es-ES");

    renderProbe();

    expect(screen.getByTestId("locale")).toHaveTextContent("es");
    expect(document.documentElement.lang).toBe("es");
  });

  it("switches language, persists it and updates <html lang>", async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.selectOptions(screen.getByRole("combobox", { name: "Language" }), "es");

    expect(screen.getByTestId("locale")).toHaveTextContent("es");
    expect(screen.getByTestId("translated")).toHaveTextContent("Idioma");
    expect(document.documentElement.lang).toBe("es");
    expect(getCookie(LOCALE_COOKIE_KEY)).toBe("es");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es");
  });

  it("remembers an explicit choice made through setLocale", async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole("button", { name: "switch-to-es" }));

    expect(getCookie(LOCALE_COOKIE_KEY)).toBe("es");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es");
  });

  it("falls back to English when asked for an unsupported language", async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole("button", { name: "switch-to-xx" }));

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("keeps untranslated strings in English instead of blanking them", () => {
    renderProbe();

    expect(screen.getByTestId("missing")).toHaveTextContent("Not in any catalog");
  });

  it("falls back to English outside a provider instead of throwing", () => {
    render(<Probe />);

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("translated")).toHaveTextContent("Language");
  });
});
