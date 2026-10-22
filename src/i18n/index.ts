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
