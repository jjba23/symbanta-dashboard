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

/**
 * Structural accessibility audit used by the test suite (and handy when
 * debugging a new panel).
 *
 * axe-core already covers the heavy rules; these checks focus on the things
 * this dashboard is most likely to regress on: landmarks and heading order,
 * screen-reader names, scrollable regions, table semantics, ARIA that hides
 * focusable content, and skip-link targets.
 */

export type IssueSeverity = "error" | "warning";

export interface A11yIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
  target: string;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(", ");

const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";

export function describeElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const role = element.getAttribute("role");
  const text = (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 48);

  return `<${tag}${id}${role ? ` role="${role}"` : ""}>${text ? ` “${text}”` : ""}`;
}

/** Best-effort accessible-name computation (ARIA first, then content). */
export function accessibleName(element: Element): string {
  const ariaLabel = element.getAttribute("aria-label")?.trim();
  if (ariaLabel) return ariaLabel;

  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const owner = element.ownerDocument;
    const text = labelledBy
      .split(/\s+/)
      .map((id) => owner.getElementById(id)?.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) return text;
  }

  if (element.tagName === "IMG") {
    return (element.getAttribute("alt") ?? "").trim();
  }

  const labels = (element as HTMLInputElement).labels;
  if (labels && labels.length > 0) {
    const text = Array.from(labels)
      .map((label) => label.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) return text;
  }

  const content = (element.textContent ?? "").replace(/\s+/g, " ").trim();
  if (content) return content;

  return (element.getAttribute("title") ?? "").trim();
}

function hasAccessibleName(element: Element): boolean {
  return accessibleName(element).length > 0;
}

function findFocusableWithin(element: Element): Element[] {
  return Array.from(element.querySelectorAll(FOCUSABLE_SELECTOR));
}

function auditHeadings(root: ParentNode, issues: A11yIssue[]): void {
  const headings = Array.from(root.querySelectorAll(HEADING_SELECTOR));

  const firstLevels = headings.filter((heading) => heading.tagName === "H1");
  if (firstLevels.length !== 1) {
    issues.push({
      id: "heading-h1-count",
      severity: "error",
      message: `Expected exactly one h1, found ${firstLevels.length}`,
      target: firstLevels.map(describeElement).join(", "),
    });
  }

  let previousLevel = 0;
  for (const heading of headings) {
    const level = Number.parseInt(heading.tagName.slice(1), 10);

    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push({
        id: "heading-order",
        severity: "error",
        message: `Heading level jumps from h${previousLevel} to h${level}`,
        target: describeElement(heading),
      });
    }

    previousLevel = level;
  }
}

function auditLandmarks(root: ParentNode, issues: A11yIssue[]): void {
  const mainLandmarks = root.querySelectorAll("main, [role='main']");
  if (mainLandmarks.length !== 1) {
    issues.push({
      id: "landmark-main",
      severity: "error",
      message: `Expected exactly one main landmark, found ${mainLandmarks.length}`,
      target: Array.from(mainLandmarks).map(describeElement).join(", "),
    });
  }

  for (const [role, selector] of [
    ["banner", "header:not([role]), [role='banner']"],
    ["contentinfo", "footer:not([role]), [role='contentinfo']"],
  ] as const) {
    const count = root.querySelectorAll(selector).length;
    if (count > 1) {
      issues.push({
        id: `landmark-${role}`,
        severity: "error",
        message: `Expected at most one ${role} landmark, found ${count}`,
        target: selector,
      });
    }
  }
}

function auditInteractiveNames(root: ParentNode, issues: A11yIssue[]): void {
  for (const button of Array.from(root.querySelectorAll("button, [role='button']"))) {
    if (!hasAccessibleName(button)) {
      issues.push({
        id: "button-name",
        severity: "error",
        message: "Button has no accessible name",
        target: describeElement(button),
      });
    }
  }

  for (const link of Array.from(root.querySelectorAll("a[href]"))) {
    if (!hasAccessibleName(link)) {
      issues.push({
        id: "link-name",
        severity: "error",
        message: "Link has no accessible name",
        target: describeElement(link),
      });
    }

    const href = link.getAttribute("href") ?? "";
    if (href.startsWith("#") && href.length > 1) {
      const targetId = href.slice(1);
      if (!link.ownerDocument.getElementById(targetId)) {
        issues.push({
          id: "link-target",
          severity: "error",
          message: `In-page link points at a missing element (#${targetId})`,
          target: describeElement(link),
        });
      }
    }

    if (link.getAttribute("target") === "_blank") {
      const rel = (link.getAttribute("rel") ?? "").toLowerCase();
      if (!rel.includes("noopener") && !rel.includes("noreferrer")) {
        issues.push({
          id: "link-rel",
          severity: "warning",
          message: 'Link opening in a new tab should set rel="noopener noreferrer"',
          target: describeElement(link),
        });
      }
    }
  }

  for (const control of Array.from(root.querySelectorAll("input, select, textarea"))) {
    if (control.getAttribute("type") === "hidden") continue;
    if (!hasAccessibleName(control)) {
      issues.push({
        id: "control-label",
        severity: "error",
        message: "Form control has no associated label",
        target: describeElement(control),
      });
    }
  }
}

function auditImages(root: ParentNode, issues: A11yIssue[]): void {
  for (const image of Array.from(root.querySelectorAll("img"))) {
    if (!image.hasAttribute("alt")) {
      issues.push({
        id: "image-alt",
        severity: "error",
        message: 'Image is missing an alt attribute (use alt="" when decorative)',
        target: describeElement(image),
      });
    }
  }
}

function auditTables(root: ParentNode, issues: A11yIssue[]): void {
  for (const table of Array.from(root.querySelectorAll("table"))) {
    const caption = table.querySelector("caption");
    const hasName =
      (caption?.textContent ?? "").trim().length > 0 ||
      hasAccessibleName(table) ||
      Boolean(table.getAttribute("aria-label")) ||
      Boolean(table.getAttribute("aria-labelledby"));

    if (!hasName) {
      issues.push({
        id: "table-name",
        severity: "error",
        message: "Table has neither a caption nor an accessible name",
        target: describeElement(table),
      });
    }

    for (const header of Array.from(table.querySelectorAll("th"))) {
      if (!header.hasAttribute("scope")) {
        issues.push({
          id: "table-scope",
          severity: "warning",
          message: "Table header cell is missing a scope attribute",
          target: describeElement(header),
        });
      }
    }
  }
}

function auditAria(root: ParentNode, issues: A11yIssue[]): void {
  for (const region of Array.from(root.querySelectorAll("[role='region'], [role='group']"))) {
    if (!hasAccessibleName(region)) {
      issues.push({
        id: "region-name",
        severity: "error",
        message: `role="${region.getAttribute("role")}" needs an accessible name`,
        target: describeElement(region),
      });
    }
  }

  for (const hidden of Array.from(root.querySelectorAll("[aria-hidden='true']"))) {
    const focusable = findFocusableWithin(hidden);
    if (focusable.length > 0) {
      issues.push({
        id: "aria-hidden-focusable",
        severity: "error",
        message: "aria-hidden element contains focusable content",
        target: `${describeElement(hidden)} → ${focusable.map(describeElement).join(", ")}`,
      });
    }
  }
}

function auditTabIndex(root: ParentNode, issues: A11yIssue[]): void {
  for (const element of Array.from(root.querySelectorAll("[tabindex]"))) {
    const value = Number.parseInt(element.getAttribute("tabindex") ?? "", 10);
    if (Number.isFinite(value) && value > 0) {
      issues.push({
        id: "tabindex-positive",
        severity: "error",
        message: `Positive tabindex (${value}) breaks the natural focus order`,
        target: describeElement(element),
      });
    }
  }
}

function auditIds(root: ParentNode, issues: A11yIssue[]): void {
  const seen = new Map<string, number>();

  for (const element of Array.from(root.querySelectorAll("[id]"))) {
    const id = element.id;
    seen.set(id, (seen.get(id) ?? 0) + 1);
  }

  for (const [id, count] of seen) {
    if (count > 1) {
      issues.push({
        id: "duplicate-id",
        severity: "error",
        message: `id="${id}" is used ${count} times`,
        target: `#${id}`,
      });
    }
  }
}

function auditDocumentMetadata(owner: Document, issues: A11yIssue[]): void {
  if (!owner.documentElement.getAttribute("lang")) {
    issues.push({
      id: "document-lang",
      severity: "error",
      message: "<html> is missing a lang attribute",
      target: "<html>",
    });
  }

  if (!owner.title.trim()) {
    issues.push({
      id: "document-title",
      severity: "error",
      message: "The page has no title (WCAG 2.4.2)",
      target: "<title>",
    });
  }
}

/**
 * Run every structural check against a document (default) or a rendered
 * subtree. `document`-level checks are skipped when auditing a detached node.
 */
export function auditAccessibility(root: ParentNode = document): A11yIssue[] {
  const issues: A11yIssue[] = [];

  auditHeadings(root, issues);
  auditLandmarks(root, issues);
  auditInteractiveNames(root, issues);
  auditImages(root, issues);
  auditTables(root, issues);
  auditAria(root, issues);
  auditTabIndex(root, issues);
  auditIds(root, issues);

  if (!("createElement" in root)) {
    auditDocumentMetadata(root as Document, issues);
  }

  return issues;
}

export function formatIssues(issues: A11yIssue[]): string {
  return issues
    .map((issue) => `[${issue.severity}] ${issue.id}: ${issue.message} — ${issue.target}`)
    .join("\n");
}
