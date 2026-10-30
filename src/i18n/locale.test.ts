// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { describe, expect, it } from "vitest";
import {
  LOCALE_NAMES,
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  localeName,
  matchSupported,
  preferredLocale,
  resolveLocale,
  translatorFor,
} from "./locale.ts";

describe("supported locales", () => {
  it("always includes the source language and the shipped catalogs", () => {
    expect(SUPPORTED_LOCALES).toContain(SOURCE_LOCALE);

    for (const locale of ["de", "es", "fr", "it", "ja", "nl", "pt"]) {
      expect(SUPPORTED_LOCALES, locale).toContain(locale);
    }
  });

  it("never lists the same locale twice", () => {
    expect(new Set(SUPPORTED_LOCALES).size).toBe(SUPPORTED_LOCALES.length);
  });

  it("names languages by their endonym", () => {
    expect(localeName("en")).toBe("English");
    expect(localeName("es")).toBe("Español");
    expect(localeName("xx")).toBe("xx");
    expect(LOCALE_NAMES["es"]).toBe("Español");
  });
});

describe("matchSupported", () => {
  it("matches an exact tag, case-insensitively", () => {
    expect(matchSupported("es")).toBe("es");
    expect(matchSupported("ES")).toBe("es");
    expect(matchSupported("en")).toBe("en");
  });

  it("falls back to the base language for regional variants", () => {
    expect(matchSupported("es-MX")).toBe("es");
    expect(matchSupported("es_AR")).toBe("es");
    expect(matchSupported("en-GB")).toBe("en");
  });

  it("returns undefined for languages without a catalog", () => {
    expect(matchSupported("sv-SE")).toBeUndefined();
    expect(matchSupported("xx")).toBeUndefined();
    expect(matchSupported("")).toBeUndefined();
    expect(matchSupported("   ")).toBeUndefined();
  });
});

describe("resolveLocale", () => {
  it("picks the first supported candidate", () => {
    expect(resolveLocale(["sv-SE", "es-ES", "en"])).toBe("es");
    expect(resolveLocale(["fr-FR", "es-ES"])).toBe("fr");
    expect(resolveLocale(["en-US"])).toBe("en");
  });

  it("falls back to the source language", () => {
    expect(resolveLocale([])).toBe("en");
    expect(resolveLocale(["sv", "xx"])).toBe("en");
  });
});

describe("preferredLocale", () => {
  it("prefers the cookie over everything else", () => {
    expect(preferredLocale({ cookie: "es", stored: "en", navigatorLanguages: ["de-DE"] })).toBe(
      "es",
    );
  });

  it("falls back to localStorage when there is no cookie", () => {
    expect(preferredLocale({ stored: "es", navigatorLanguages: ["de-DE"] })).toBe("es");
  });

  it("ignores stored languages that have no catalog", () => {
    expect(preferredLocale({ cookie: "sv", stored: "xx", navigatorLanguages: ["es-ES"] })).toBe(
      "es",
    );
  });

  it("uses the browser preferences when nothing is stored", () => {
    expect(preferredLocale({ navigatorLanguages: ["es-ES", "en-US"] })).toBe("es");
    expect(preferredLocale({ navigatorLanguages: ["en-US"] })).toBe("en");
    expect(preferredLocale({})).toBe("en");
  });
});

describe("translatorFor", () => {
  it("returns the source language verbatim", () => {
    const translator = translatorFor("en");

    expect(translator.t("Language")).toBe("Language");
    expect(translator.tn("{count} entry", "{count} entries", 2)).toBe("2 entries");
  });

  it("applies the Spanish catalog", () => {
    const translator = translatorFor("es");

    expect(translator.t("Language")).toBe("Idioma");
  });

  it("memoises translators per locale", () => {
    expect(translatorFor("es")).toBe(translatorFor("es"));
    expect(translatorFor("es")).not.toBe(translatorFor("en"));
  });

  it("falls back to English for locales without a catalog", () => {
    const translator = translatorFor("xx");

    expect(translator.t("Language")).toBe("Language");
  });
});
