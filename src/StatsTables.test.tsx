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
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useGetCountryStats,
  useGetEventStats,
  useGetRouteStats,
  useGetScreenSizeStats,
  useGetUserAgentStats,
} from "./api/symbanta.ts";
import { CountryStatsTable } from "./CountryStatsTable.tsx";
import { EventStatsTable } from "./EventStatsTable.tsx";
import { PeriodProvider } from "./PeriodContext.tsx";
import { RouteStatsTable } from "./RouteStatsTable.tsx";
import { ScreenSizeStatsTable } from "./ScreenSizeStatsTable.tsx";
import { UserAgentStatsTable } from "./UserAgentStatsTable.tsx";

vi.mock("./api/symbanta.ts", () => ({
  useGetRouteStats: vi.fn(),
  useGetScreenSizeStats: vi.fn(),
  useGetUserAgentStats: vi.fn(),
  useGetCountryStats: vi.fn(),
  useGetEventStats: vi.fn(),
}));

const mocks = [
  useGetRouteStats,
  useGetScreenSizeStats,
  useGetUserAgentStats,
  useGetCountryStats,
  useGetEventStats,
].map((hook) => vi.mocked(hook));

function mockQuery(mock: unknown, overrides: Record<string, unknown>) {
  (mock as { mockReturnValue: (value: unknown) => void }).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  });
}

interface PanelCase {
  heading: string;
  emptyHeading: string;
  viewsHeader: string;
  mock: unknown;
  item: Record<string, unknown>;
  label: string | RegExp;
  renderPanel: () => ReactElement;
}

const panels: PanelCase[] = [
  {
    heading: "Top routes",
    emptyHeading: "No route data available",
    viewsHeader: "Views",
    mock: mocks[0],
    item: { route: "", pageViews: 42, visitors: 7 },
    label: "/",
    renderPanel: () => <RouteStatsTable domain="example.com" />,
  },
  {
    heading: "Screen sizes",
    emptyHeading: "No screen size data available",
    viewsHeader: "Views",
    mock: mocks[1],
    item: { size: "1920x1080", pageViews: 42, visitors: 7 },
    label: "1920x1080",
    renderPanel: () => <ScreenSizeStatsTable domain="example.com" />,
  },
  {
    heading: "User agents",
    emptyHeading: "No user agent data available",
    viewsHeader: "Views",
    mock: mocks[2],
    item: { userAgent: "Firefox/131", pageViews: 42, visitors: 7 },
    label: "Firefox/131",
    renderPanel: () => <UserAgentStatsTable domain="example.com" />,
  },
  {
    heading: "Countries",
    emptyHeading: "No country data available",
    viewsHeader: "Views",
    mock: mocks[3],
    item: { country: "NL", pageViews: 42, visitors: 7 },
    label: /\(NL\)/,
    renderPanel: () => <CountryStatsTable domain="example.com" />,
  },
  {
    heading: "Events",
    emptyHeading: "No events recorded",
    viewsHeader: "Occurrences",
    mock: mocks[4],
    item: { eventName: "signup-click", occurrences: 42, visitors: 7 },
    label: "signup-click",
    renderPanel: () => <EventStatsTable domain="example.com" />,
  },
];

beforeEach(() => {
  for (const mock of mocks) {
    mock.mockReset();
  }
});

describe.each(panels)("$heading panel", (panel) => {
  function renderPanel() {
    return render(<PeriodProvider>{panel.renderPanel()}</PeriodProvider>);
  }

  it("renders the breakdown rows", () => {
    mockQuery(panel.mock, { data: { data: { items: [panel.item] }, status: 200 } });

    renderPanel();

    expect(screen.getByRole("heading", { name: panel.heading })).toBeInTheDocument();
    expect(screen.getByText(panel.label)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: panel.viewsHeader })).toBeInTheDocument();
  });

  it("shows an empty state when there is no data", () => {
    mockQuery(panel.mock, { data: { data: { items: [] }, status: 200 } });

    renderPanel();

    expect(screen.getByRole("heading", { name: panel.emptyHeading })).toBeInTheDocument();
  });

  it("surfaces the API problem details on failure", () => {
    mockQuery(panel.mock, { isError: true, error: { data: { detail: "Domain not found" } } });

    renderPanel();

    expect(screen.getByRole("alert")).toHaveTextContent("Domain not found");
  });
});
