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

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../App.tsx";
import { auditAccessibility, formatIssues } from "./domAudit.ts";
import { formatViolations, runAxeAudit } from "./axe.ts";

/**
 * End-to-end accessibility pass over the real component tree: every panel is
 * rendered with representative data, then checked twice — once by the
 * structural audit in `domAudit.ts`, once by axe-core's WCAG 2.1 A/AA rules.
 */

const from = "2026-09-07T08:00:00Z";
const to = "2026-09-14T09:00:00Z";

const summary = {
  from,
  to,
  pageViews: 12840,
  visitors: 5320,
  bounceRate: 41.2,
  averageDurationMillis: 96000,
};

const timeSeries = {
  granularity: "DAY",
  from,
  to,
  points: [
    { timestamp: "2026-09-07T00:00:00Z", pageViews: 1200, visitors: 480 },
    { timestamp: "2026-09-08T00:00:00Z", pageViews: 1500, visitors: 610 },
  ],
};

const routeStats = { from, to, items: [{ route: "/", pageViews: 900, visitors: 410 }] };
const screenSizeStats = { from, to, items: [{ size: "1920x1080", pageViews: 640, visitors: 300 }] };
const userAgentStats = {
  from,
  to,
  items: [{ userAgent: "Firefox/130", pageViews: 520, visitors: 260 }],
};
const eventStats = {
  from,
  to,
  items: [{ eventName: "signup-click", occurrences: 42, visitors: 31 }],
};
const countryStats = { from, to, items: [{ country: "ES", pageViews: 800, visitors: 350 }] };

const consoleLogs = {
  items: [
    {
      timestamp: "2026-09-07T08:52:00Z",
      level: "error",
      message: "Checkout failed",
      url: "/checkout",
      country: "ES",
    },
  ],
};

const eventTypes = {
  eventTypes: [{ id: "1", name: "signup-click", description: "Signup button", createdAt: from }],
};

const properties = {
  properties: [{ id: "1", domain: "example.com", createdAt: from }],
};

vi.mock("../api/symbanta.ts", () => {
  const query = (data: unknown) => ({
    data: { data, status: 200, headers: new Headers() },
    isLoading: false,
    isError: false,
    isSuccess: true,
    error: null,
  });

  return {
    getGetEventTypesQueryKey: ({ domain }: { domain: string }) => ["event-types", domain],
    useGetCurrentUser: () => query({ username: "anonymized", role: "admin" }),
    useGetProperties: () => query(properties),
    useGetStatsSummary: () => query(summary),
    useGetTimeSeriesStats: () => query(timeSeries),
    useGetRouteStats: () => query(routeStats),
    useGetScreenSizeStats: () => query(screenSizeStats),
    useGetUserAgentStats: () => query(userAgentStats),
    useGetEventStats: () => query(eventStats),
    useGetCountryStats: () => query(countryStats),
    useGetConsoleLogs: () => query(consoleLogs),
    useGetEventTypes: () => query(eventTypes),
    useRegisterEventType: () => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
    }),
  };
});

async function renderDashboard() {
  render(<App />);
  await screen.findByRole("heading", { name: "Overview" });
}

describe("dashboard accessibility", () => {
  it("exposes exactly one h1, one main landmark and labelled panels", async () => {
    await renderDashboard();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");

    const main = screen.getByRole("main");
    const overview = within(main).getByRole("region", { name: "Overview" });
    expect(overview.tagName).toBe("SECTION");
  });

  it("provides a keyboard skip link that targets the main landmark", async () => {
    const user = userEvent.setup();
    await renderDashboard();

    await user.tab();
    const skipLink = screen.getByRole("link", { name: /skip to the analytics/i });
    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(document.getElementById("main-content")).not.toBeNull();
  });

  it("offers a screen-reader table alternative for the traffic chart", async () => {
    await renderDashboard();

    const chart = screen.getByRole("img", { name: /traffic trends chart/i });
    expect(chart).toBeInTheDocument();

    const table = screen.getByRole("table", { name: /traffic trends for the selected period/i });
    expect(within(table).getByRole("columnheader", { name: "Page views" })).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Unique visitors" }),
    ).toBeInTheDocument();
    expect(within(table).getAllByRole("rowheader")).toHaveLength(timeSeries.points.length);
  });

  it("makes the scrollable tables reachable and named", async () => {
    await renderDashboard();

    const region = screen.getByRole("region", { name: "Route breakdown" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(within(region).getByRole("table")).toHaveAccessibleName(/route breakdown/i);
  });

  it("announces refresh progress through a polite live region", async () => {
    await renderDashboard();

    const filters = screen.getByRole("group", { name: "Reporting filters" });
    const status = within(filters).getByRole("status");

    expect(status).toHaveAttribute("aria-live", "polite");
    expect(within(filters).getByRole("button", { name: "Refresh" })).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });

  it("passes the structural audit", async () => {
    await renderDashboard();

    const issues = auditAccessibility(document);
    expect(issues, formatIssues(issues)).toEqual([]);
  });

  it("passes axe-core WCAG 2.1 A/AA", async () => {
    await renderDashboard();

    const results = await runAxeAudit(document.body);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
