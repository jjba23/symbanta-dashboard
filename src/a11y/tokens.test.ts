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

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseColor, ratioLabel } from "./contrast.ts";
import {
  THEMES,
  buildColorPairs,
  failingColorPairs,
  measureColorPairs,
  resolveSurface,
  surfaces,
  textTokens,
  type SurfaceName,
} from "./tokens.ts";

describe("colour contract", () => {
  it("declares at least one requirement per theme", () => {
    for (const theme of THEMES) {
      expect(Object.keys(textTokens[theme]).length).toBeGreaterThan(8);
    }
    expect(buildColorPairs().length).toBeGreaterThan(20);
  });

  it("passes WCAG AA for every declared text and icon colour", () => {
    const failures = failingColorPairs();

    expect(
      failures.map(
        (failure) =>
          `${failure.theme}/${failure.token}: ${failure.foreground} on ${failure.surface} ` +
          `(${failure.background}) = ${ratioLabel(failure.ratio)}, needs ${failure.required}:1 — ` +
          failure.description,
      ),
    ).toEqual([]);
  });

  it("keeps decorative marks documented as aria-hidden-only", () => {
    const decorative = measureColorPairs().filter((measurement) => measurement.decorative);

    expect(decorative.length).toBeGreaterThan(0);
    for (const measurement of decorative) {
      expect(measurement.description).toMatch(/aria-hidden/);
    }
  });

  it("only exempts decorative pairs from the ratio requirement", () => {
    for (const measurement of measureColorPairs()) {
      if (measurement.decorative) continue;
      expect(measurement.passes, `${measurement.theme}/${measurement.token}`).toBe(true);
    }
  });

  it("resolves every material to an opaque colour", () => {
    for (const theme of THEMES) {
      for (const name of Object.keys(surfaces[theme]) as SurfaceName[]) {
        const resolved = resolveSurface(theme, name);

        expect(parseColor(resolved).a, `${theme}/${name}`).toBe(1);
        expect(surfaces[theme][name].length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the light materials lighter than the dark ones", () => {
    const lightGlass = parseColor(resolveSurface("light", "glass"));
    const darkGlass = parseColor(resolveSurface("dark", "glass"));

    expect(lightGlass.r + lightGlass.g + lightGlass.b).toBeGreaterThan(
      darkGlass.r + darkGlass.g + darkGlass.b,
    );
  });
});

/**
 * The sticky toolbar has to stay legible while tables scroll underneath it, so
 * its material must be denser than the panel material. These values are read
 * straight out of `src/index.css` so the CSS and this contract cannot drift.
 */
describe("sticky toolbar material", () => {
  // Vitest stubs CSS imports out, so read the stylesheet from disk instead.
  const css: string = readFileSync(join(process.cwd(), "src", "index.css"), "utf8");

  /** Every declaration of a custom property, in file order. */
  function declarationsOf(variable: string): string[] {
    const pattern = new RegExp(`${variable}:\\s*([^;]+);`, "g");
    return Array.from(css.matchAll(pattern), (match) => (match[1] ?? "").trim());
  }

  /** Lowest alpha in a declaration; opaque hex/keyword colours count as 1. */
  function minAlpha(declaration: string): number {
    const alphas = Array.from(declaration.matchAll(/\/\s*(0?\.\d+|1)\s*\)/g), (match) =>
      Number(match[1]),
    );

    if (alphas.length === 0) {
      return /^#[0-9a-f]{3,8}$/i.test(declaration) ? 1 : Number.NaN;
    }

    return Math.min(...alphas);
  }

  it("declares toolbar-specific tokens instead of reusing the panel gradient", () => {
    expect(css).toMatch(/--glass-toolbar-bg:/);
    expect(css).toMatch(/--glass-toolbar-border:/);
    expect(css).toMatch(/\.glass-toolbar\s*{/);
  });

  it("keeps the surfaces translucent enough to read as glass", () => {
    expect(minAlpha(declarationsOf("--glass-bg")[0] ?? "")).toBeLessThan(0.9);
    expect(minAlpha(declarationsOf("--glass-toolbar-bg")[0] ?? "")).toBeLessThan(1);
  });

  it.each(THEMES)("keeps the %s toolbar denser than its panels", (theme) => {
    const offset = theme === "light" ? 0 : 1;

    const panel = minAlpha(declarationsOf("--glass-bg")[offset] ?? "");
    const toolbar = minAlpha(declarationsOf("--glass-toolbar-bg")[offset] ?? "");

    expect(Number.isFinite(panel), `${theme} panel alpha`).toBe(true);
    expect(Number.isFinite(toolbar), `${theme} toolbar alpha`).toBe(true);
    expect(toolbar).toBeGreaterThan(panel);
    expect(toolbar).toBeGreaterThanOrEqual(0.88);
  });
});
