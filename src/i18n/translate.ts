// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import {
  catalogPluralRule,
  lookupTranslation,
  NO_CONTEXT,
  type CompiledCatalog,
} from "./catalog.ts";
import { DEFAULT_PLURAL_RULE, type PluralRule } from "./plural.ts";

/**
 * A tiny gettext runtime.
 *
 * The semantics follow GNU gettext closely enough that catalogs behave the way
 * translators expect:
 *
 * - a missing or empty `msgstr` falls back to the source string (`msgid`);
 * - `msgctxt` disambiguates identical English strings;
 * - plural forms are selected with the catalog's own `Plural-Forms` rule;
 * - placeholders are named (`{count}`, `{domain}`, …) and interpolated with
 *   locale-aware number formatting.
 *
 * Interpolation deliberately does *not* use printf: `msgfmt --check-format`
 * cannot validate named placeholders anyway, and named ones are far friendlier
 * for translators. `src/i18n/catalog.test.ts` checks that every translation
 * keeps exactly the placeholders of its source string.
 */

export type TranslateParams = Record<string, string | number>;

export interface Translator {
  readonly locale: string;
  readonly pluralRule: PluralRule;
  /** Translate a `msgid` (the English source string). */
  t(msgid: string, params?: TranslateParams): string;
  /** Translate a singular/plural pair for `count`. */
  tn(msgid: string, msgidPlural: string, count: number, params?: TranslateParams): string;
  /** Translate an ambiguous `msgid` using its `msgctxt`. */
  tContext(context: string, msgid: string, params?: TranslateParams): string;
  /** Contextual plural translation. */
  tnContext(
    context: string,
    msgid: string,
    msgidPlural: string,
    count: number,
    params?: TranslateParams,
  ): string;
}

const PLACEHOLDER_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;

function formatValue(value: string | number, locale: string): string {
  if (typeof value === "number") {
    try {
      return new Intl.NumberFormat(locale).format(value);
    } catch {
      return String(value);
    }
  }

  return value;
}

/** Replace `{name}` placeholders; unknown names are left untouched. */
export function interpolate(message: string, params: TranslateParams = {}, locale = "en"): string {
  return message.replace(PLACEHOLDER_PATTERN, (match, name: string) => {
    if (!Object.hasOwn(params, name)) return match;
    const value = params[name];
    return value === undefined ? match : formatValue(value, locale);
  });
}

function translated(
  catalog: CompiledCatalog | undefined,
  context: string,
  msgid: string,
  index = 0,
): string | undefined {
  const forms = lookupTranslation(catalog, context, msgid);
  const form = forms?.[index];

  return form !== undefined && form.length > 0 ? form : undefined;
}

/**
 * Build a translator bound to one locale.
 *
 * `catalog` may be missing (English is the source language), in which case
 * messages are returned verbatim — and plurals follow the English rule.
 */
export function createTranslator(locale: string, catalog?: CompiledCatalog): Translator {
  const hasCatalog = catalog !== undefined;
  // The source language needs no catalog: its plural rule is the default one.
  const pluralRule: PluralRule = hasCatalog ? catalogPluralRule(catalog) : DEFAULT_PLURAL_RULE;

  const singular = (context: string, msgid: string, params?: TranslateParams): string => {
    const message = translated(catalog, context, msgid) ?? msgid;
    return interpolate(message, params, locale);
  };

  const plural = (
    context: string,
    msgid: string,
    msgidPlural: string,
    count: number,
    params?: TranslateParams,
  ): string => {
    const merged: TranslateParams = { count, ...params };
    const forms = lookupTranslation(catalog, context, msgid);
    const source = count === 1 ? msgid : msgidPlural;

    if (forms && forms.length > 0) {
      // Never reuse another plural form when a catalog is incomplete: fall
      // back to the source string instead, so a broken catalog is obvious.
      const index = pluralRule.select(count);
      const form = forms[index] ?? "";
      if (form.length > 0) {
        return interpolate(form, merged, locale);
      }
    }

    return interpolate(source, merged, locale);
  };

  return {
    locale,
    pluralRule,
    t: (msgid, params) => singular(NO_CONTEXT, msgid, params),
    tn: (msgid, msgidPlural, count, params) =>
      plural(NO_CONTEXT, msgid, msgidPlural, count, params),
    tContext: (context, msgid, params) => singular(context, msgid, params),
    tnContext: (context, msgid, msgidPlural, count, params) =>
      plural(context, msgid, msgidPlural, count, params),
  };
}

/** Locale-aware number formatting for the dashboard's own helpers. */
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return String(value);
  }
}
