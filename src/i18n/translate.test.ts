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

import { describe, expect, it } from "vitest";
import type { CompiledCatalog } from "./catalog.ts";
import { createTranslator, formatNumber, interpolate } from "./translate.ts";

const spanish: CompiledCatalog = {
  headers: {
    "content-type": "text/plain; charset=UTF-8",
    language: "es",
    "plural-forms": "nplurals=2; plural=(n != 1);",
  },
  messages: {
    "": {
      Hello: ["Hola"],
      "Hello, {name}": ["Hola, {name}"],
      "Loading analytics…": ["Cargando analíticas…"],
      "{count} visitor": ["{count} visitante", "{count} visitantes"],
      Untranslated: [""],
    },
    menu: {
      Open: ["Abrir"],
      "{count} file": ["{count} archivo", "{count} ficheros"],
    },
  },
};

describe("interpolate", () => {
  it("replaces named placeholders", () => {
    expect(interpolate("Hello, {name}!", { name: "Ada" })).toBe("Hello, Ada!");
  });

  it("keeps unknown placeholders visible instead of printing undefined", () => {
    expect(interpolate("Hello, {name}!", {})).toBe("Hello, {name}!");
  });

  it("formats numbers with the active locale", () => {
    expect(interpolate("{count} views", { count: 1234 }, "de-DE")).toBe("1.234 views");
  });
});

describe("createTranslator", () => {
  it("returns the source strings when there is no catalog (English)", () => {
    const translator = createTranslator("en");

    expect(translator.locale).toBe("en");
    expect(translator.t("Hello")).toBe("Hello");
    expect(translator.t("Hello, {name}", { name: "Ada" })).toBe("Hello, Ada");
  });

  it("translates msgids with the catalog", () => {
    const translator = createTranslator("es", spanish);

    expect(translator.t("Hello")).toBe("Hola");
    expect(translator.t("Loading analytics…")).toBe("Cargando analíticas…");
    expect(translator.t("Hello, {name}", { name: "Ada" })).toBe("Hola, Ada");
  });

  it("falls back to the msgid for missing or empty translations", () => {
    const translator = createTranslator("es", spanish);

    expect(translator.t("Not in the catalog")).toBe("Not in the catalog");
    expect(translator.t("Untranslated")).toBe("Untranslated");
  });

  it("respects msgctxt for ambiguous strings", () => {
    const translator = createTranslator("es", spanish);

    expect(translator.t("Open")).toBe("Open");
    expect(translator.tContext("menu", "Open")).toBe("Abrir");
  });

  it("selects plural forms with the catalog's own rule and injects {count}", () => {
    const translator = createTranslator("es", spanish);

    expect(translator.tn("{count} visitor", "{count} visitors", 1)).toBe("1 visitante");
    expect(translator.tn("{count} visitor", "{count} visitors", 2)).toBe("2 visitantes");
    expect(translator.tn("{count} visitor", "{count} visitors", 0)).toBe("0 visitantes");
  });

  it("supports contextual plurals", () => {
    const translator = createTranslator("es", spanish);

    expect(translator.tnContext("menu", "{count} file", "{count} files", 1)).toBe("1 archivo");
    expect(translator.tnContext("menu", "{count} file", "{count} files", 5)).toBe("5 ficheros");
  });

  it("falls back to the English plural pair when the catalog has no entry", () => {
    const translator = createTranslator("es", spanish);

    expect(translator.tn("{count} day", "{count} days", 1)).toBe("1 day");
    expect(translator.tn("{count} day", "{count} days", 4)).toBe("4 days");
  });

  it("uses the English rule when the catalog omits Plural-Forms", () => {
    const translator = createTranslator("es", { headers: {}, messages: {} });

    expect(translator.pluralRule.nplurals).toBe(2);
    expect(translator.pluralRule.select(1)).toBe(0);
    expect(translator.pluralRule.select(3)).toBe(1);
  });

  it("does not crash on a catalog with fewer forms than its plural rule", () => {
    const broken: CompiledCatalog = {
      headers: { "plural-forms": "nplurals=3; plural=(n==1 ? 0 : n==2 ? 1 : 2);" },
      messages: { "": { "{count} thing": ["one thing"] } },
    };
    const translator = createTranslator("xx", broken);

    expect(translator.tn("{count} thing", "{count} things", 1)).toBe("one thing");
    expect(translator.tn("{count} thing", "{count} things", 3)).toBe("3 things");
  });

  it("keeps explicit parameters over the injected count", () => {
    const translator = createTranslator("en");

    expect(translator.tn("{count} of {total}", "{count} of {total}", 2, { total: 10 })).toBe(
      "2 of 10",
    );
  });
});

describe("formatNumber", () => {
  it("formats with the requested locale", () => {
    expect(formatNumber(1234, "en-US")).toBe("1,234");
    expect(formatNumber(1234, "de-DE")).toBe("1.234");
  });

  it("falls back to a plain string for invalid locales", () => {
    expect(formatNumber(42, "not a locale")).toBe("42");
  });
});
