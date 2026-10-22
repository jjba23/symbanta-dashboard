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

import { describe, expect, it } from "vitest";
import { DEFAULT_PLURAL_RULE, parsePluralForms } from "./plural.ts";

/**
 * The `Plural-Forms` headers below are copied verbatim from real GNU gettext
 * catalogs, so the evaluator is tested against what translators actually ship.
 */
const HEADERS = {
  english: "nplurals=2; plural=(n != 1);",
  spanish: "nplurals=2; plural=(n != 1);",
  japanese: "nplurals=1; plural=0;",
  polish: "nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);",
  russian:
    "nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);",
  czech: "nplurals=3; plural=(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2;",
  arabic:
    "nplurals=6; plural=n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 ? 4 : 5;",
};

describe("parsePluralForms", () => {
  it("uses the catalog header, including the trailing semicolon layout gettext emits", () => {
    const rule = parsePluralForms(`Plural-Forms: ${HEADERS.english}\n`);

    expect(rule.nplurals).toBe(2);
    expect([0, 1, 2, 100].map(rule.select)).toEqual([1, 0, 1, 1]);
  });

  it("handles two-form languages", () => {
    const rule = parsePluralForms(HEADERS.spanish);

    expect(rule.nplurals).toBe(2);
    expect(rule.select(1)).toBe(0);
    expect(rule.select(2)).toBe(1);
    expect(rule.select(0)).toBe(1);
  });

  it("handles single-form languages", () => {
    const rule = parsePluralForms(HEADERS.japanese);

    expect(rule.nplurals).toBe(1);
    expect([0, 1, 7, 1000].map(rule.select)).toEqual([0, 0, 0, 0]);
  });

  it("handles the Polish three-form rule", () => {
    const rule = parsePluralForms(HEADERS.polish);

    expect(rule.nplurals).toBe(3);
    expect(rule.select(1)).toBe(0);
    expect(rule.select(2)).toBe(1);
    expect(rule.select(4)).toBe(1);
    expect(rule.select(5)).toBe(2);
    expect(rule.select(12)).toBe(2);
    expect(rule.select(22)).toBe(1);
    expect(rule.select(25)).toBe(2);
    expect(rule.select(0)).toBe(2);
  });

  it("handles the Russian three-form rule", () => {
    const rule = parsePluralForms(HEADERS.russian);

    expect(rule.select(1)).toBe(0);
    expect(rule.select(21)).toBe(0);
    expect(rule.select(2)).toBe(1);
    expect(rule.select(24)).toBe(1);
    expect(rule.select(5)).toBe(2);
    expect(rule.select(11)).toBe(2);
    expect(rule.select(111)).toBe(2);
  });

  it("handles the Czech rule, which mixes equality and ranges", () => {
    const rule = parsePluralForms(HEADERS.czech);

    expect([1, 2, 4, 5].map(rule.select)).toEqual([0, 1, 1, 2]);
  });

  it("handles the six-form Arabic rule", () => {
    const rule = parsePluralForms(HEADERS.arabic);

    expect(rule.nplurals).toBe(6);
    expect([0, 1, 2, 3, 10, 11, 100, 102].map(rule.select)).toEqual([0, 1, 2, 3, 3, 4, 5, 5]);
  });

  it("normalises negative and fractional counts", () => {
    const rule = parsePluralForms(HEADERS.english);

    expect(rule.select(-1)).toBe(0);
    expect(rule.select(1.9)).toBe(0);
    expect(rule.select(-2.4)).toBe(1);
  });

  it("clamps out-of-range results into the declared form count", () => {
    const rule = parsePluralForms("nplurals=2; plural=(n);");

    expect(rule.select(0)).toBe(0);
    expect(rule.select(1)).toBe(1);
    expect(rule.select(99)).toBe(1);
  });

  it("falls back to English for missing or malformed headers", () => {
    const headers = [
      undefined,
      "",
      "nplurals=2",
      "plural=(n != 1);",
      "nplurals=0; plural=0;",
      "nplurals=2; plural=(n ** 2);",
      "nplurals=2; plural=evaluate(n);",
      "nplurals=2; plural=(n != 1",
      "nplurals=2; plural=n != 1 extra;",
    ];

    for (const header of headers) {
      const rule = parsePluralForms(header);
      expect(rule.nplurals, String(header)).toBe(DEFAULT_PLURAL_RULE.nplurals);
      expect(rule.select(1), String(header)).toBe(0);
      expect(rule.select(2), String(header)).toBe(1);
    }
  });

  it("never throws, no matter what the header contains", () => {
    const garbage = ["nplurals=3; plural=((((", "nplurals=3; plural=///", "nplurals=3; plural=n?"];

    for (const header of garbage) {
      expect(() => parsePluralForms(header)).not.toThrow();
    }
  });
});
