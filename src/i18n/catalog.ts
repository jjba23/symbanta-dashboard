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

import { DEFAULT_PLURAL_RULE, parsePluralForms, type PluralRule } from "./plural.ts";

/**
 * A compiled gettext catalog.
 *
 * This is exactly what `i18n/vite-plugin.ts` emits for a `.po` file at build
 * time: the header fields plus a two-level lookup table
 * (`context → msgid → plural forms`). The empty string is the "no context"
 * domain, which is how gettext models `msgid` without `msgctxt`.
 */
export interface CompiledCatalog {
  /** Lower-cased PO header names, e.g. `plural-forms`, `language`. */
  headers: Record<string, string>;
  /** context ("" for none) → msgid → msgstr(s). */
  messages: Record<string, Record<string, string[]>>;
}

const NO_CONTEXT = "";

/** Plural rule declared by the catalog header, falling back to English. */
export function catalogPluralRule(catalog: CompiledCatalog | undefined): PluralRule {
  if (!catalog) return DEFAULT_PLURAL_RULE;

  return parsePluralForms(catalog.headers["plural-forms"]);
}

/** All translations for one msgid, in plural-form order. */
export function lookupTranslation(
  catalog: CompiledCatalog | undefined,
  context: string,
  msgid: string,
): string[] | undefined {
  return catalog?.messages[context === NO_CONTEXT ? NO_CONTEXT : context]?.[msgid];
}

export { NO_CONTEXT };
