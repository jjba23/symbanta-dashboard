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
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Period } from "./api/model";
import {
  formattedDate,
  formattedDateRange,
  formattedDateRangeShort,
  periodLabels,
} from "./Prelude.ts";
import {
  Card,
  CardHeader,
  DateRangeBadge,
  EmptyState,
  ErrorState,
  PeriodSelect,
  StatsSkeleton,
  StatsTable,
  TableSkeleton,
  TagIcon,
  type StatRow,
} from "./ui.tsx";

const rows: StatRow[] = [
  { label: "/", pageViews: 60, visitors: 40 },
  { label: "/pricing", pageViews: 30, visitors: 25 },
  { label: "/blog", pageViews: 10, visitors: 9 },
];

describe("StatsTable", () => {
  it("renders one row per entry with views, visitors and share", () => {
    render(<StatsTable rows={rows} labelHeader="Route" />);

    expect(screen.getByRole("columnheader", { name: "Route" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Views" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Visitors" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Share" })).toBeInTheDocument();

    expect(screen.getByText("/pricing")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
  });

  it("computes each row's share of the total", () => {
    render(<StatsTable rows={rows} labelHeader="Route" />);

    expect(screen.getByText("60.0%")).toBeInTheDocument();
    expect(screen.getByText("30.0%")).toBeInTheDocument();
    expect(screen.getByText("10.0%")).toBeInTheDocument();
  });

  it("rounds shares to a single decimal", () => {
    render(
      <StatsTable
        rows={[
          { label: "a", pageViews: 1, visitors: 1 },
          { label: "b", pageViews: 2, visitors: 2 },
        ]}
        labelHeader="Label"
      />,
    );

    expect(screen.getByText("33.3%")).toBeInTheDocument();
    expect(screen.getByText("66.7%")).toBeInTheDocument();
  });

  it("shows 0% when there are no views at all", () => {
    render(<StatsTable rows={[{ label: "a", pageViews: 0, visitors: 0 }]} labelHeader="Label" />);

    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("falls back to a neutral label for blank labels", () => {
    render(<StatsTable rows={[{ label: "", pageViews: 5, visitors: 5 }]} labelHeader="Route" />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("supports a custom label for blank entries (e.g. the site root)", () => {
    render(
      <StatsTable
        rows={[{ label: "", pageViews: 5, visitors: 5 }]}
        labelHeader="Route"
        emptyLabel="/"
      />,
    );

    expect(screen.getByTitle("/")).toHaveTextContent("/");
  });

  it("supports custom value headers (e.g. event occurrences)", () => {
    render(<StatsTable rows={rows} labelHeader="Event" viewsHeader="Occurrences" />);

    expect(screen.getByRole("columnheader", { name: "Occurrences" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Views" })).not.toBeInTheDocument();
  });

  it("caps the share bar width at 100%", () => {
    render(<StatsTable rows={[{ label: "a", pageViews: 5, visitors: 1 }]} labelHeader="Label" />);

    const bar = document.querySelector<HTMLDivElement>("[style*='width']");
    expect(bar?.style.width).toBe("100%");
  });
});

describe("DateRangeBadge", () => {
  it("shows the exact timestamp within a single day", () => {
    const from = new Date("2026-09-07T08:52:00Z");
    const to = new Date("2026-09-07T18:00:00Z");

    render(<DateRangeBadge from={from} to={to} />);

    expect(screen.getByText(formattedDate(from))).toBeInTheDocument();
    expect(screen.getByTitle(formattedDateRange(from, to))).toBeInTheDocument();
  });

  it("shows a compact range across several days", () => {
    const from = new Date("2026-09-07T08:52:00Z");
    const to = new Date("2026-09-14T09:00:00Z");

    render(<DateRangeBadge from={from} to={to} />);

    expect(screen.getByText(formattedDateRangeShort(from, to))).toBeInTheDocument();
  });
});

describe("PeriodSelect", () => {
  it("lists every selectable period but not the custom placeholder", () => {
    render(<PeriodSelect value={Period.LAST_7_DAYS} onChange={() => {}} />);

    const select = screen.getByRole("combobox", { name: "Reporting period" });
    const options = Array.from(select.querySelectorAll("option"));

    expect(options).toHaveLength(Object.values(Period).length - 1);
    expect(options.map((option) => option.value)).not.toContain(Period.CUSTOM);
    expect(screen.getByRole("option", { name: periodLabels[Period.TODAY] })).toBeInTheDocument();
  });

  it("reports the selected period", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<PeriodSelect value={Period.LAST_7_DAYS} onChange={onChange} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Reporting period" }),
      Period.LAST_30_DAYS,
    );

    expect(onChange).toHaveBeenCalledWith(Period.LAST_30_DAYS);
  });
});

describe("states", () => {
  it("renders an empty state with title and description", () => {
    render(
      <EmptyState
        icon={<TagIcon />}
        title="Nothing here yet"
        description="Come back after the first visit."
      />,
    );

    expect(screen.getByRole("heading", { name: "Nothing here yet" })).toBeInTheDocument();
    expect(screen.getByText("Come back after the first visit.")).toBeInTheDocument();
  });

  it("renders an error state as an alert", () => {
    render(<ErrorState title="Could not load routes" message="Domain not found" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Could not load routes");
    expect(alert).toHaveTextContent("Domain not found");
  });

  it("announces loading skeletons to assistive technology", () => {
    const { unmount } = render(<TableSkeleton />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading analytics…");

    unmount();
    render(<StatsSkeleton />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading summary…");
  });
});

describe("Card", () => {
  it("renders header content, subtitle and domain badge", () => {
    render(
      <Card>
        <CardHeader title="Overview" domain="example.com" subtitle="Traffic highlights" />
      </Card>,
    );

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("Traffic highlights")).toBeInTheDocument();
    expect(screen.getByTitle("example.com")).toHaveTextContent("example.com");
  });

  it("supports an id for in-page navigation", () => {
    const { container } = render(
      <Card id="traffic">
        <p>content</p>
      </Card>,
    );

    expect(container.querySelector("#traffic")).not.toBeNull();
  });
});
