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

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { V1StatsSummaryResponse } from "./api/model";
import { useGetStatsSummary } from "./api/symbanta.ts";
import { PeriodProvider } from "./PeriodContext.tsx";
import { StatsDashboard } from "./StatsDashboard.tsx";
import { formattedDateRange } from "./Prelude.ts";

vi.mock("./api/symbanta.ts", () => ({
  useGetStatsSummary: vi.fn(),
}));

const summaryMock = vi.mocked(useGetStatsSummary);

type SummaryQuery = ReturnType<typeof useGetStatsSummary>;

function mockQuery(overrides: Record<string, unknown>) {
  summaryMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as SummaryQuery);
}

function mockSummary(summary: V1StatsSummaryResponse) {
  mockQuery({ data: { data: summary, status: 200 } });
}

function renderDashboard() {
  return render(
    <PeriodProvider>
      <StatsDashboard domain="example.com" />
    </PeriodProvider>,
  );
}

beforeEach(() => {
  summaryMock.mockReset();
});

describe("StatsDashboard", () => {
  it("shows a skeleton while the summary loads", () => {
    mockQuery({ isLoading: true });

    renderDashboard();

    expect(screen.getByRole("status")).toHaveTextContent("Loading summary…");
    expect(screen.queryByText("Page Views")).not.toBeInTheDocument();
  });

  it("renders the requested domain and period in the header", () => {
    mockQuery({ isLoading: true });

    renderDashboard();

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByTitle("example.com")).toHaveTextContent("example.com");
    expect(screen.getByText("Traffic highlights for the selected period")).toBeInTheDocument();
  });

  it("renders the headline metrics", () => {
    mockSummary({
      pageViews: 512,
      visitors: 128,
      bounceRate: 42.126,
      averageDurationMillis: 90_500,
    });

    renderDashboard();

    expect(screen.getByText("Page Views")).toBeInTheDocument();
    expect(screen.getByText("512")).toBeInTheDocument();
    expect(screen.getByText("Unique Visitors")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("1m 30.50s")).toBeInTheDocument();
    expect(screen.getByText("42.13%")).toBeInTheDocument();
  });

  it("shows the reporting range when the API sends one", () => {
    const from = "2026-09-07T08:52:00Z";
    const to = "2026-09-14T09:00:00Z";
    mockSummary({ pageViews: 3, visitors: 2, from, to });

    renderDashboard();

    expect(screen.getByTitle(formattedDateRange(new Date(from), new Date(to)))).toBeInTheDocument();
  });

  it("renders an error state with the API problem details", () => {
    mockQuery({ isError: true, error: { data: { detail: "Domain not found" } } });

    renderDashboard();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Could not load the overview");
    expect(alert).toHaveTextContent("Domain not found");
  });

  it("falls back to a generic message for unknown errors", () => {
    mockQuery({ isError: true, error: {} });

    renderDashboard();

    expect(screen.getByRole("alert")).toHaveTextContent("An unknown error occurred");
  });

  it("renders an empty state when the period has no traffic", () => {
    mockSummary({ pageViews: 0, visitors: 0 });

    renderDashboard();

    expect(screen.getByRole("heading", { name: "No summary data available" })).toBeInTheDocument();
    expect(screen.getByText(/No traffic activity recorded for/)).toBeInTheDocument();
  });

  it("still shows the metrics when only one counter is zero", () => {
    mockSummary({ pageViews: 7, visitors: 0, bounceRate: 100 });

    renderDashboard();

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
