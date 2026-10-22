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
import { findTextTokens, type ThemeName } from "./tokens.ts";

/**
 * Guard rail for the colour contract.
 *
 * `tokens.ts` declares the colour of every piece of text and every icon.
 * This test walks the components and fails when a `text-*` utility appears that
 * nobody measured — i.e. when someone introduces a new shade of grey that has
 * never been checked against the frosted materials (or against dark mode).
 *
 * The sources are pulled in with Vite's raw glob import, so the test has no
 * Node-only dependencies and lints exactly the code that ships.
 */

const sources = import.meta.glob("../**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const TEXT_UTILITY = /(?<![\w-])((?:[a-z0-9-]+:)*)text-([a-z]+)-(\d{2,3})(?![\w-])/g;

interface Usage {
  file: string;
  theme: ThemeName;
  className: string;
}

function componentSources(): Array<[string, string]> {
  return Object.entries(sources)
    .filter(([path]) => !/\.test\.(tsx|ts)$/.test(path))
    .filter(([path]) => !path.includes("/test/"));
}

function collectUsages(): Usage[] {
  const usages: Usage[] = [];

  for (const [file, source] of componentSources()) {
    for (const match of source.matchAll(TEXT_UTILITY)) {
      const modifiers = (match[1] ?? "").split(":").filter(Boolean);
      const color = match[2];
      const shade = match[3];

      if (!color || !shade) continue;

      usages.push({
        file: file.replace(/^\.\.\//, ""),
        theme: modifiers.includes("dark") ? "dark" : "light",
        className: `${color}-${shade}`,
      });
    }
  }

  return usages;
}

describe("text colour utilities", () => {
  const usages = collectUsages();

  it("finds the component colour utilities it is supposed to police", () => {
    expect(usages.length).toBeGreaterThan(50);
    expect(new Set(usages.map((usage) => usage.className)).size).toBeGreaterThan(15);
  });

  it("declares every text utility in the colour contract", () => {
    const unmapped = usages
      .filter((usage) => findTextTokens(usage.theme, usage.className).length === 0)
      .map((usage) => `${usage.file}: ${usage.theme} ${usage.className}`);

    expect(unmapped).toEqual([]);
  });

  it("never mixes a light-mode shade into dark mode by accident", () => {
    // A `dark:` variant must resolve to a measured light-on-dark shade,
    // otherwise the text disappears into the smoked glass.
    const suspicious = usages
      .filter((usage) => usage.theme === "dark")
      .filter((usage) => findTextTokens("dark", usage.className).length === 0)
      .map((usage) => `${usage.file}: dark ${usage.className}`);

    expect(suspicious).toEqual([]);
  });
});
