// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

/**
 * Extract translatable strings into `src/i18n/locales/symbanta.pot` and merge
 * them into every `*.po` catalog.
 *
 *   npm run i18n:extract   # update the template and the catalogs
 *   npm run i18n:check     # fail if the template or a catalog is out of date
 *
 * The extractor understands the TypeScript AST (unlike `xgettext`, which
 * cannot parse TSX), but it writes ordinary PO files, so GNU gettext tooling
 * (`msgfmt`, `msgmerge`, Poedit, Weblate) keeps working on the results.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import type {
  GetTextTranslation,
  GetTextTranslationRecord,
  GetTextTranslations,
} from "gettext-parser";
import ts from "typescript";
import {
  NO_CONTEXT,
  POT_HEADERS,
  headerValue,
  npluralsOf,
  parsePo,
  serializePo,
  translationRecord,
} from "./po.ts";

const ROOT = process.cwd();
const SOURCE_DIR = join(ROOT, "src");
const LOCALES_DIR = join(SOURCE_DIR, "i18n", "locales");
export const POT_FILE = join(LOCALES_DIR, "symbanta.pot");

/** Directories that never contain translatable calls. */
const SKIPPED_DIRECTORIES = ["api"];

export interface ExtractedEntry {
  context: string;
  msgid: string;
  plural?: string;
  /** `path:line` references, as gettext stores them. */
  references: string[];
}

export interface ExtractionResult {
  entries: ExtractedEntry[];
  /** Calls whose arguments are not static strings — they cannot be extracted. */
  problems: string[];
}

interface FunctionSpec {
  context?: number;
  msgid: number;
  plural?: number;
}

/**
 * The runtime API, mirrored from `src/i18n/translate.ts`. Index positions tell
 * the extractor where each argument lives.
 */
const FUNCTION_SPECS: Record<string, FunctionSpec> = {
  t: { msgid: 0 },
  tn: { msgid: 0, plural: 1 },
  tContext: { context: 0, msgid: 1 },
  tnContext: { context: 0, msgid: 1, plural: 2 },
};

function sourceFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;

    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.includes(entry.name)) continue;
      files.push(...sourceFiles(path));
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (/\.test\.(ts|tsx)$/.test(entry.name)) continue;

    files.push(path);
  }

  return files.sort();
}

function calleeName(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) return expression.text;
  // `i18n.t("…")` is accepted too, so a translator object can be passed around.
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return undefined;
}

function staticString(node: ts.Expression | undefined): string | undefined {
  if (node === undefined) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

/** Walk one file and collect every translatable call. */
function extractFromFile(file: string, entries: ExtractedEntry[], problems: string[]): void {
  const source = readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TSX,
  );
  const relativePath = relative(ROOT, file);

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const name = calleeName(node.expression);
      // `Object.hasOwn` avoids matching Object.prototype members such as
      // `toString` and `toLocaleString` for calls like `value.toString()`.
      const spec =
        name !== undefined && Object.hasOwn(FUNCTION_SPECS, name)
          ? FUNCTION_SPECS[name]
          : undefined;

      if (spec !== undefined) {
        const reference = `${relativePath}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
        const msgid = staticString(node.arguments[spec.msgid]);
        const plural =
          spec.plural === undefined ? undefined : staticString(node.arguments[spec.plural]);
        const context =
          spec.context === undefined ? undefined : staticString(node.arguments[spec.context]);

        if (msgid === undefined) {
          problems.push(`${reference}: ${name}() needs a static string msgid`);
        } else {
          entries.push({
            context: context ?? NO_CONTEXT,
            msgid,
            ...(plural === undefined ? {} : { plural }),
            references: [reference],
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

/** Collect every translatable string in `src/`, with references and problems. */
export function extractMessages(): ExtractionResult {
  const entries: ExtractedEntry[] = [];
  const problems: string[] = [];

  for (const file of sourceFiles(SOURCE_DIR)) {
    extractFromFile(file, entries, problems);
  }

  const merged = new Map<string, ExtractedEntry>();

  for (const entry of entries) {
    const key = `${entry.context}\u0004${entry.msgid}`;
    const existing = merged.get(key);

    if (existing === undefined) {
      merged.set(key, { ...entry });
      continue;
    }

    if (entry.plural !== undefined && existing.plural !== entry.plural) {
      problems.push(
        `${entry.references[0]}: "${entry.msgid}" is used with two different plural forms`,
      );
    }

    for (const reference of entry.references) {
      if (!existing.references.includes(reference)) existing.references.push(reference);
    }
  }

  const sorted = [...merged.values()].sort((left, right) => {
    if (left.context !== right.context) return left.context.localeCompare(right.context);
    return left.msgid.localeCompare(right.msgid);
  });

  for (const entry of sorted) {
    entry.references = [...new Set(entry.references)].sort();
  }

  return { entries: sorted, problems };
}

/** Build the `.pot` template from extracted entries. */
export function buildTemplate(entries: ExtractedEntry[]): GetTextTranslations {
  const translations: GetTextTranslationRecord = {};

  for (const entry of entries) {
    translations[entry.context] ??= {};
    const bucket = translations[entry.context];
    if (bucket === undefined) continue;

    bucket[entry.msgid] = translationRecord(
      entry.msgid,
      entry.plural,
      entry.plural === undefined ? [""] : ["", ""],
      entry.references,
    );
  }

  return {
    charset: "utf-8",
    headers: { ...POT_HEADERS },
    translations,
  };
}

export interface MergeResult {
  data: GetTextTranslations;
  added: string[];
  removed: string[];
}

/**
 * Merge extracted entries into an existing catalog, preserving translations,
 * translator comments and flags. Entries that disappeared from the source are
 * dropped (git keeps the history, `msgmerge` users can resurrect them).
 */
export function mergeCatalog(
  existing: GetTextTranslations,
  entries: ExtractedEntry[],
  language: string,
): MergeResult {
  const nplurals = npluralsOf(existing);
  const translations: GetTextTranslationRecord = {};
  const added: string[] = [];

  // Preserve the catalog intro (`#` comments above the header entry), which is
  // where translators leave notes about the project.
  const headerEntry = existing.translations[NO_CONTEXT]?.[""];
  if (headerEntry !== undefined) {
    translations[NO_CONTEXT] = { "": headerEntry };
  }

  for (const entry of entries) {
    const previous = existing.translations[entry.context]?.[entry.msgid];
    const bucketKey = entry.context;
    translations[bucketKey] ??= {};
    const bucket = translations[bucketKey];
    if (bucket === undefined) continue;

    const pluralChanged = (previous?.msgid_plural ?? undefined) !== entry.plural;

    if (previous === undefined || pluralChanged) {
      added.push(entry.msgid);
    }

    const msgstr =
      pluralChanged || previous === undefined
        ? entry.plural === undefined
          ? [""]
          : Array.from({ length: nplurals }, () => "")
        : previous.msgstr;

    const comments: NonNullable<GetTextTranslation["comments"]> = {
      reference: entry.references.join("\n"),
    };
    if (previous?.comments?.translator) comments.translator = previous.comments.translator;
    if (previous?.comments?.extracted) comments.extracted = previous.comments.extracted;
    if (previous?.comments?.flag) comments.flag = previous.comments.flag;

    bucket[entry.msgid] = {
      msgid: entry.msgid,
      ...(entry.plural === undefined ? {} : { msgid_plural: entry.plural }),
      msgstr,
      comments,
    };
  }

  const removed: string[] = [];
  for (const [context, bucket] of Object.entries(existing.translations)) {
    for (const msgid of Object.keys(bucket ?? {})) {
      if (msgid === "" || msgid === NO_CONTEXT) continue;
      if (entries.some((entry) => entry.context === context && entry.msgid === msgid)) continue;
      removed.push(msgid);
    }
  }

  const headers: Record<string, string> = { ...existing.headers };

  // Keep the casing a human wrote ("Plural-Forms"), but guarantee the fields
  // the runtime depends on are present.
  const setHeader = (name: string, value: string) => {
    const key = Object.keys(headers).find(
      (candidate) => candidate.toLowerCase() === name.toLowerCase(),
    );
    headers[key ?? name] = value;
  };

  setHeader("Language", language);
  setHeader(
    "Content-Type",
    headerValue(existing.headers, "content-type") ?? "text/plain; charset=UTF-8",
  );
  setHeader(
    "Plural-Forms",
    headerValue(existing.headers, "plural-forms") ?? "nplurals=2; plural=(n != 1);",
  );

  return {
    data: { charset: existing.charset || "utf-8", headers, translations },
    added,
    removed,
  };
}

function readCatalog(path: string): GetTextTranslations | undefined {
  return existsSync(path) ? parsePo(readFileSync(path, "utf8")) : undefined;
}

export interface SyncSummary {
  templateChanged: boolean;
  catalogs: Array<{ file: string; changed: boolean; added: number; removed: number }>;
  problems: string[];
}

/** Regenerate the template + catalogs (or just report drift in check mode). */
export function syncCatalogs(options: { write: boolean }): SyncSummary {
  mkdirSync(LOCALES_DIR, { recursive: true });
  const { entries, problems } = extractMessages();
  const template = buildTemplate(entries);
  const templateSource = serializePo(template);

  const existingTemplate = existsSync(POT_FILE) ? readFileSync(POT_FILE, "utf8") : "";
  const templateChanged = existingTemplate !== templateSource;

  if (options.write && templateChanged) {
    writeFileSync(POT_FILE, templateSource, "utf8");
  }

  const catalogs: SyncSummary["catalogs"] = [];

  for (const file of readdirSync(LOCALES_DIR).sort()) {
    if (!file.endsWith(".po")) continue;

    const path = join(LOCALES_DIR, file);
    const language = basename(file, ".po");
    const existing = readCatalog(path);

    if (existing === undefined) continue;

    const merged = mergeCatalog(existing, entries, language);
    const mergedSource = serializePo(merged.data);
    const changed = mergedSource !== readFileSync(path, "utf8");

    if (options.write && changed) {
      writeFileSync(path, mergedSource, "utf8");
    }

    catalogs.push({ file, changed, added: merged.added.length, removed: merged.removed.length });
  }

  return { templateChanged, catalogs, problems };
}

function main(argv: string[]): void {
  const check = argv.includes("--check");
  const summary = syncCatalogs({ write: !check });

  for (const problem of summary.problems) {
    console.error(`⚠︎  ${problem}`);
  }

  if (check) {
    let failed = summary.problems.length > 0;

    if (summary.templateChanged) {
      console.error(
        "✗  src/i18n/locales/symbanta.pot is out of date — run `npm run i18n:extract`.",
      );
      failed = true;
    }

    for (const catalog of summary.catalogs) {
      if (!catalog.changed) continue;
      console.error(
        `✗  ${catalog.file} is out of date (+${catalog.added} new, -${catalog.removed} obsolete) — run \`npm run i18n:extract\`.`,
      );
      failed = true;
    }

    if (failed) process.exitCode = 1;
    else console.log("✓  gettext catalogs are up to date.");
    return;
  }

  console.log(summary.templateChanged ? "✓  symbanta.pot updated." : "✓  symbanta.pot unchanged.");

  for (const catalog of summary.catalogs) {
    console.log(
      catalog.changed
        ? `✓  ${catalog.file} updated (+${catalog.added} new, -${catalog.removed} obsolete).`
        : `✓  ${catalog.file} unchanged.`,
    );
  }
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main(process.argv.slice(2));
}
