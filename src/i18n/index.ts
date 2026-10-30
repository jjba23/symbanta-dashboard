// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

export {
  I18nProvider,
  useI18n,
  readInitialLocale,
  LOCALE_COOKIE_KEY,
  LOCALE_STORAGE_KEY,
} from "./I18nContext.tsx";
export { LocaleSwitcher } from "./LocaleSwitcher.tsx";
export {
  SOURCE_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_NAMES,
  localeName,
  matchSupported,
  preferredLocale,
  resolveLocale,
  translatorFor,
  catalogFor,
} from "./locale.ts";
export { createTranslator, formatNumber, interpolate } from "./translate.ts";
export { parsePluralForms, DEFAULT_PLURAL_RULE } from "./plural.ts";
export type { Translator, TranslateParams } from "./translate.ts";
export type { CompiledCatalog } from "./catalog.ts";
export type { PluralRule } from "./plural.ts";
