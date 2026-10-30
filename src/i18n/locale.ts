// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import type { CompiledCatalog } from "./catalog.ts";
import { createTranslator, type Translator } from "./translate.ts";

export const SOURCE_LOCALE = "en";

/**
 * Catalog files are discovered at build time: dropping a new
 * `src/i18n/locales/<code>.po` in place is all it takes to add a language.
 * `i18n/vite-plugin.ts` compiles each PO into a plain object.
 */
const catalogModules = import.meta.glob("./locales/*.po", {
  eager: true,
  import: "default",
}) as Record<string, CompiledCatalog>;

const catalogs: Record<string, CompiledCatalog> = {};

for (const [path, catalog] of Object.entries(catalogModules)) {
  const code = path.split("/").pop()?.replace(/\.po$/, "");
  if (code !== undefined && code.length > 0) {
    catalogs[code] = catalog;
  }
}

/**
 * Endonyms — a language is always offered in its own language, so these are
 * deliberately *not* translated.
 */
export const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ca: "Català",
  de: "Deutsch",
  eo: "Esperanto",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  ja: "日本語",
  nl: "Nederlands",
  pl: "Polski",
  pt: "Português",
  ru: "Русский",
  uk: "Українська",
  zh: "中文",
};

/** Source language first, then every locale that has a catalog, sorted. */
export const SUPPORTED_LOCALES: string[] = [
  SOURCE_LOCALE,
  ...Object.keys(catalogs)
    .filter((code) => code !== SOURCE_LOCALE)
    .sort((left, right) => left.localeCompare(right)),
];

export function localeName(locale: string): string {
  return LOCALE_NAMES[locale] ?? locale;
}

export function catalogFor(locale: string): CompiledCatalog | undefined {
  return locale === SOURCE_LOCALE ? undefined : catalogs[locale];
}

const translatorCache = new Map<string, Translator>();

/** A translator for the locale, memoised: catalogs never change at runtime. */
export function translatorFor(locale: string): Translator {
  const cached = translatorCache.get(locale);
  if (cached) return cached;

  const translator = createTranslator(locale, catalogFor(locale));
  translatorCache.set(locale, translator);
  return translator;
}

function normalise(tag: string): string {
  return tag.trim().replace(/_/g, "-").toLowerCase();
}

/** Exact match, then the base language (`es-MX` → `es`). */
export function matchSupported(tag: string): string | undefined {
  const normalised = normalise(tag);
  if (normalised.length === 0) return undefined;

  const exact = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === normalised);
  if (exact !== undefined) return exact;

  const base = normalised.split("-")[0];
  if (base === undefined) return undefined;

  return SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === base);
}

/** Best supported locale for a preference list, falling back to English. */
export function resolveLocale(candidates: readonly string[]): string {
  for (const candidate of candidates) {
    const match = matchSupported(candidate);
    if (match !== undefined) return match;
  }

  return SOURCE_LOCALE;
}

/**
 * Decide the locale to start with.
 *
 * Order: an explicit choice (cookie, then `localStorage`), then the browser's
 * preference list, then English. Pure so it can be tested and reused by the
 * pre-paint snippet in `main.tsx`.
 */
export function preferredLocale(options: {
  cookie?: string | undefined;
  stored?: string | null | undefined;
  navigatorLanguages?: readonly string[] | undefined;
}): string {
  const explicit = options.cookie || options.stored || "";
  if (explicit.length > 0) {
    const match = matchSupported(explicit);
    if (match !== undefined) return match;
  }

  return resolveLocale(options.navigatorLanguages ?? []);
}
