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

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCookie, setCookie } from "../Prelude.ts";
import {
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  localeName,
  preferredLocale,
  translatorFor,
} from "./locale.ts";
import type { Translator } from "./translate.ts";

export const LOCALE_COOKIE_KEY = "symbanta_locale";
export const LOCALE_STORAGE_KEY = "locale";

export interface I18nContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  /** Everything the switcher needs to offer a choice. */
  locales: string[];
  localeName: (locale: string) => string;
  /** Translate a msgid (the English source string). */
  t: Translator["t"];
  /** Translate a singular/plural pair for `count`. */
  tn: Translator["tn"];
  /** Translate an ambiguous msgid using its msgctxt. */
  tContext: Translator["tContext"];
  /** Contextual plural translation. */
  tnContext: Translator["tnContext"];
}

const I18nContext: React.Context<I18nContextValue | undefined> = createContext<
  I18nContextValue | undefined
>(undefined);

/**
 * Used when a component is rendered outside a provider — unit tests and
 * isolated stories, mostly. Everything falls back to the source language, so
 * the UI keeps working instead of throwing.
 */
const fallbackTranslator = translatorFor(SOURCE_LOCALE);

const FALLBACK_CONTEXT: I18nContextValue = {
  locale: SOURCE_LOCALE,
  locales: SUPPORTED_LOCALES,
  localeName,
  setLocale: () => {},
  t: fallbackTranslator.t,
  tn: fallbackTranslator.tn,
  tContext: fallbackTranslator.tContext,
  tnContext: fallbackTranslator.tnContext,
};

function browserLanguages(): string[] {
  if (typeof navigator === "undefined") return [];

  return [...(navigator.languages ?? []), navigator.language].filter(
    (language): language is string => typeof language === "string" && language.length > 0,
  );
}

export function readInitialLocale(): string {
  return preferredLocale({
    cookie: getCookie(LOCALE_COOKIE_KEY),
    stored:
      typeof localStorage === "undefined" ? undefined : localStorage.getItem(LOCALE_STORAGE_KEY),
    navigatorLanguages: browserLanguages(),
  });
}

/**
 * Holds the active locale.
 *
 * The choice is remembered in a cookie (server-readable, like the theme) and in
 * `localStorage` (survives cookie clearing). `<html lang>` follows the locale,
 * because screen readers pick their pronunciation from it.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>(readInitialLocale);

  const translator = useMemo(() => translatorFor(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      locales: SUPPORTED_LOCALES,
      localeName,
      setLocale: (next: string) => {
        const resolved = SUPPORTED_LOCALES.includes(next) ? next : SOURCE_LOCALE;
        setLocaleState(resolved);
        setCookie(LOCALE_COOKIE_KEY, resolved);
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(LOCALE_STORAGE_KEY, resolved);
        }
      },
      t: translator.t,
      tn: translator.tn,
      tContext: translator.tContext,
      tnContext: translator.tnContext,
    }),
    [locale, translator],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext) ?? FALLBACK_CONTEXT;
}
