// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { GetTextTranslation, GetTextTranslations } from "gettext-parser";
import { headerValue, npluralsOf, parsePo } from "../../i18n/po.ts";
import { syncCatalogs } from "../../i18n/extract.ts";
import { compileCatalog } from "../../i18n/po.ts";

/**
 * Catalog quality gates.
 *
 * These run in `npm test` (and therefore in CI), so a UI string can never be
 * added or changed without the catalogs following — and a translation can
 * never silently drop a `{placeholder}`.
 */

const LOCALES_DIR = join(process.cwd(), "src", "i18n", "locales");
const TEMPLATE = join(LOCALES_DIR, "symbanta.pot");

const PLACEHOLDER = /\{([a-zA-Z0-9_]+)\}/g;

function placeholders(message: string): string[] {
  return [...message.matchAll(PLACEHOLDER)].map((match) => match[1] ?? "").sort();
}

interface CatalogFile {
  name: string;
  language: string;
  data: GetTextTranslations;
}

function catalogFiles(): CatalogFile[] {
  return readdirSync(LOCALES_DIR)
    .filter((file) => file.endsWith(".po"))
    .sort()
    .map((file) => ({
      name: file,
      language: file.replace(/\.po$/, ""),
      data: parsePo(readFileSync(join(LOCALES_DIR, file), "utf8")),
    }));
}

function entriesOf(data: GetTextTranslations): Array<[string, GetTextTranslation]> {
  const entries: Array<[string, GetTextTranslation]> = [];

  for (const bucket of Object.values(data.translations)) {
    for (const [msgid, entry] of Object.entries(bucket ?? {})) {
      if (msgid === "" || entry === undefined) continue;
      entries.push([msgid, entry]);
    }
  }

  return entries;
}

const template = parsePo(readFileSync(TEMPLATE, "utf8"));
const templateMsgids = new Set(entriesOf(template).map(([msgid]) => msgid));
const catalogs = catalogFiles();

describe("the gettext template", () => {
  it("is in sync with the source code", () => {
    const summary = syncCatalogs({ write: false });

    expect(summary.problems).toEqual([]);
    expect(summary.templateChanged, "run `npm run i18n:extract`").toBe(false);
  });

  it("declares a plural-forms placeholder for translators", () => {
    expect(headerValue(template.headers, "plural-forms")).toMatch(/nplurals=INTEGER/);
  });

  it("tracks at least one string per panel", () => {
    expect(templateMsgids.size).toBeGreaterThan(100);
  });
});

describe.each(catalogs)("$name", (catalog) => {
  const entries = entriesOf(catalog.data);

  it("declares its language and plural forms", () => {
    expect(headerValue(catalog.data.headers, "language")?.toLowerCase()).toBe(catalog.language);
    expect(headerValue(catalog.data.headers, "plural-forms")).toMatch(/nplurals=\d+/);
  });

  it("is in sync with the template", () => {
    const summary = syncCatalogs({ write: false });
    const entry = summary.catalogs.find((candidate) => candidate.file === catalog.name);

    expect(entry, `${catalog.name} is missing from the sync summary`).toBeDefined();
    expect(entry?.changed, "run `npm run i18n:extract`").toBe(false);
  });

  it("translates every string in the template", () => {
    const missing = [...templateMsgids].filter(
      (msgid) => !entries.some(([candidate]) => candidate === msgid),
    );

    expect(missing).toEqual([]);
  });

  it("has no obsolete entries", () => {
    const known = new Set([...templateMsgids, ""]);
    const obsolete = entries.map(([msgid]) => msgid).filter((msgid) => !known.has(msgid));

    expect(obsolete).toEqual([]);
  });

  it("contains no empty translations", () => {
    const empty = entries
      .filter(([, entry]) => entry.msgstr.length === 0 || entry.msgstr.some((form) => form === ""))
      .map(([msgid]) => msgid);

    expect(empty).toEqual([]);
  });

  it("keeps every placeholder of the source string", () => {
    const broken = entries
      .filter(([msgid, entry]) => {
        const source = entry.msgid_plural ?? msgid;
        const expected = placeholders(source);
        return entry.msgstr.some(
          (form) => JSON.stringify(placeholders(form)) !== JSON.stringify(expected),
        );
      })
      .map(([msgid]) => msgid);

    expect(broken).toEqual([]);
  });

  it("provides exactly as many plural forms as its Plural-Forms header", () => {
    const nplurals = npluralsOf(catalog.data);
    const wrong = entries
      .filter(([, entry]) => entry.msgid_plural !== undefined)
      .filter(([, entry]) => entry.msgstr.length !== nplurals)
      .map(([msgid]) => msgid);

    expect(wrong).toEqual([]);
  });

  it("never reuses a singular translation for a plural msgid", () => {
    const mismatched = entries
      .filter(([msgid, entry]) => entry.msgid_plural === undefined && msgid !== entry.msgid)
      .map(([msgid]) => msgid);

    expect(mismatched).toEqual([]);
  });

  it("compiles into the runtime catalog shape", () => {
    const compiled = compileCatalog(readFileSync(join(LOCALES_DIR, catalog.name), "utf8"));

    expect(compiled.headers["language"]).toBe(catalog.language);
    expect(Object.keys(compiled.messages).length).toBeGreaterThan(0);
    expect(compiled.messages[""]).toBeDefined();
  });
});
