// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import axe from "axe-core";
import type { AxeResults, Result, RunOptions } from "axe-core";

/**
 * axe-core, pointed at the WCAG 2.1 A/AA rule set (plus the WCAG 2.2 AA ones
 * axe ships). Two rules are disabled on purpose:
 *
 * - `color-contrast` / `color-contrast-enhanced`: jsdom has no layout engine,
 *   so axe cannot sample the pixels behind translucent glass. The same
 *   requirement is covered exactly, and more strictly, by `tokens.test.ts`.
 * - `scrollable-region-focusable`: jsdom never reports overflow, so every
 *   scroll container looks unscrollable. The rule is honoured in the markup
 *   instead (`role="region"` + `tabindex="0"` on the scroll containers).
 */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const DISABLED_RULES: NonNullable<RunOptions["rules"]> = {
  "color-contrast": { enabled: false },
  "color-contrast-enhanced": { enabled: false },
  "scrollable-region-focusable": { enabled: false },
};

export async function runAxeAudit(
  container: Element = document.body,
  overrides: RunOptions = {},
): Promise<AxeResults> {
  return axe.run(container, {
    runOnly: { type: "tag", values: WCAG_TAGS },
    rules: DISABLED_RULES,
    resultTypes: ["violations"],
    ...overrides,
  });
}

export function formatViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `${node.target.join(" ")} — ${node.failureSummary ?? ""}`)
        .join("\n    ");
      return `[${violation.impact ?? "unknown"}] ${violation.id}: ${violation.help}\n    ${nodes}`;
    })
    .join("\n");
}
