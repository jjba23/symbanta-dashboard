// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

/**
 * Reading, writing and compiling GNU gettext PO files.
 *
 * `gettext-parser` does the format work (quoting, wrapping, escapes) so the
 * catalogs stay byte-compatible with Poedit, Weblate, `msgmerge` and friends.
 * This module only adds the adaptation to the runtime shape in
 * `src/i18n/catalog.ts`.
 */

import { po } from "gettext-parser";
import type { GetTextTranslation, GetTextTranslations } from "gettext-parser";
import type { CompiledCatalog } from "../src/i18n/catalog.ts";

export const NO_CONTEXT = "";

/** Header block written into every freshly generated template. */
export const POT_HEADERS: Record<string, string> = {
  "Project-Id-Version": "symbanta-dashboard",
  "Report-Msgid-Bugs-To": "https://codeberg.org/jjba23/symbanta-dashboard/issues",
  "MIME-Version": "1.0",
  "Content-Type": "text/plain; charset=UTF-8",
  "Content-Transfer-Encoding": "8bit",
  Language: "",
  "Plural-Forms": "nplurals=INTEGER; plural=EXPRESSION;",
};

/** Parse a `.po`/`.pot` file into gettext-parser's table. */
export function parsePo(source: string): GetTextTranslations {
  return po.parse(source, { defaultCharset: "utf-8" });
}

/** Serialise a table back to PO syntax (wrapped like GNU tools do). */
export function serializePo(data: GetTextTranslations): string {
  return po.compile(data, { sort: false }).toString("utf8");
}

/**
 * Case-insensitive header lookup: translators write `Plural-Forms`, the
 * runtime looks up `plural-forms`, and both must agree.
 */
export function headerValue(
  headers: Record<string, string> | undefined,
  name: string,
): string | undefined {
  if (headers === undefined) return undefined;

  const key = Object.keys(headers).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase(),
  );

  return key === undefined ? undefined : headers[key];
}

/** Number of plural forms declared by a catalog header (defaults to 2). */
export function npluralsOf(data: GetTextTranslations): number {
  const header = headerValue(data.headers, "plural-forms") ?? "";
  const match = /nplurals\s*=\s*(\d+)/i.exec(header);
  const parsed = match?.[1] ? Number.parseInt(match[1], 10) : Number.NaN;

  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 2;
}

/**
 * Compile a PO source into the shape the browser runtime consumes:
 * lower-cased headers plus `context → msgid → msgstr[]`, skipping the header
 * entry itself and any obsolete (`#~`) translations.
 */
export function compileCatalog(source: string): CompiledCatalog {
  const parsed = parsePo(source);

  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(parsed.headers ?? {})) {
    headers[name.toLowerCase()] = String(value).trim();
  }

  const messages: Record<string, Record<string, string[]>> = {};

  for (const [context, entries] of Object.entries(parsed.translations ?? {})) {
    const bucket: Record<string, string[]> = {};

    for (const [msgid, entry] of Object.entries(entries ?? {})) {
      if (msgid === NO_CONTEXT || msgid === "") continue;
      if (entry === undefined || entry.obsolete === true) continue;

      const forms = Array.isArray(entry.msgstr) ? entry.msgstr : [entry.msgstr];
      bucket[msgid] = forms.map((form) => String(form ?? ""));
    }

    if (Object.keys(bucket).length > 0) {
      messages[context] = bucket;
    }
  }

  return { headers, messages };
}

/** Build the singular/plural translation record for one extracted message. */
export function translationRecord(
  msgid: string,
  plural: string | undefined,
  msgstr: string[],
  references: string[],
): GetTextTranslation {
  return {
    msgid,
    ...(plural === undefined ? {} : { msgid_plural: plural }),
    msgstr,
    comments: { reference: references.join("\n") },
  };
}
