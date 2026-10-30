// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Period } from "./api/model";
import { PeriodProvider, usePeriod } from "./PeriodContext.tsx";
import { getCookie, setCookie } from "./Prelude.ts";

const PERIOD_COOKIE = "symbanta_selected_period";

function PeriodProbe() {
  const { period, setPeriod } = usePeriod();

  return (
    <div>
      <span data-testid="period">{period}</span>
      <button type="button" onClick={() => setPeriod(Period.TODAY)}>
        Today
      </button>
      <button type="button" onClick={() => setPeriod(Period.ALL_TIME)}>
        All time
      </button>
    </div>
  );
}

describe("PeriodProvider", () => {
  it("defaults to the last seven days", () => {
    render(
      <PeriodProvider>
        <PeriodProbe />
      </PeriodProvider>,
    );

    expect(screen.getByTestId("period")).toHaveTextContent(Period.LAST_7_DAYS);
  });

  it("restores the period from the cookie", () => {
    setCookie(PERIOD_COOKIE, Period.LAST_30_DAYS);

    render(
      <PeriodProvider>
        <PeriodProbe />
      </PeriodProvider>,
    );

    expect(screen.getByTestId("period")).toHaveTextContent(Period.LAST_30_DAYS);
  });

  it("ignores an unknown cookie value", () => {
    setCookie(PERIOD_COOKIE, "SINCE_THE_DAWN_OF_TIME");

    render(
      <PeriodProvider>
        <PeriodProbe />
      </PeriodProvider>,
    );

    expect(screen.getByTestId("period")).toHaveTextContent(Period.LAST_7_DAYS);
  });

  it("updates the period and remembers the choice", async () => {
    const user = userEvent.setup();

    render(
      <PeriodProvider>
        <PeriodProbe />
      </PeriodProvider>,
    );

    await user.click(screen.getByRole("button", { name: "All time" }));

    expect(screen.getByTestId("period")).toHaveTextContent(Period.ALL_TIME);
    expect(getCookie(PERIOD_COOKIE)).toBe(Period.ALL_TIME);

    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(getCookie(PERIOD_COOKIE)).toBe(Period.TODAY);
  });

  it("throws a helpful error when used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<PeriodProbe />)).toThrow("usePeriod must be used within a PeriodProvider");
  });
});
