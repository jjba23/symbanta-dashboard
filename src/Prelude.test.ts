// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { describe, expect, it } from "vitest";
import { Period } from "./api/model";
import {
  errorMessage,
  formatDuration,
  formattedDate,
  formattedDateRange,
  formattedDateRangeShort,
  formattedDateShort,
  getCookie,
  periodLabels,
  roundToTwoPlaces,
  setCookie,
} from "./Prelude.ts";

describe("roundToTwoPlaces", () => {
  it("rounds to two decimals", () => {
    expect(roundToTwoPlaces(2.3456)).toBe(2.35);
    expect(roundToTwoPlaces(0.004)).toBe(0);
    expect(roundToTwoPlaces(42)).toBe(42);
  });

  it("avoids the classic floating point rounding trap", () => {
    expect(roundToTwoPlaces(1.005)).toBe(1.01);
  });

  it("keeps negative numbers negative", () => {
    expect(roundToTwoPlaces(-1.234)).toBe(-1.23);
  });
});

describe("formatDuration", () => {
  it("formats seconds only for short visits", () => {
    expect(formatDuration(0)).toBe("0.00s");
    expect(formatDuration(45)).toBe("45.00s");
    expect(formatDuration(9.5)).toBe("9.50s");
  });

  it("adds minutes and hours as needed", () => {
    expect(formatDuration(60)).toBe("1m 0.00s");
    expect(formatDuration(125)).toBe("2m 5.00s");
    expect(formatDuration(3600)).toBe("1h 0m 0.00s");
    expect(formatDuration(3725.25)).toBe("1h 2m 5.25s");
  });

  it("falls back to zero for negative input", () => {
    expect(formatDuration(-5)).toBe("0s");
  });
});

describe("errorMessage", () => {
  it("prefers the RFC 7807 detail from the response body", () => {
    expect(errorMessage({ data: { detail: "Domain not found" } })).toBe("Domain not found");
  });

  it("falls back to the body title", () => {
    expect(errorMessage({ data: { title: "Bad Request" } })).toBe("Bad Request");
  });

  it("accepts flat problem details", () => {
    expect(errorMessage({ detail: "Nope", title: "Conflict" })).toBe("Nope");
    expect(errorMessage({ title: "Conflict" })).toBe("Conflict");
  });

  it("uses transport error messages", () => {
    expect(errorMessage(new Error("Network down"))).toBe("Network down");
  });

  it("has a generic fallback", () => {
    expect(errorMessage(undefined)).toBe("An unknown error occurred");
    expect(errorMessage(null)).toBe("An unknown error occurred");
    expect(errorMessage({})).toBe("An unknown error occurred");
  });

  it("ignores empty strings", () => {
    expect(errorMessage({ detail: "", message: "Real message" })).toBe("Real message");
  });
});

describe("periodLabels", () => {
  it("labels every reporting period", () => {
    for (const period of Object.values(Period)) {
      expect(periodLabels[period]).toBeTruthy();
    }
  });

  it("uses human readable labels", () => {
    expect(periodLabels[Period.TODAY]).toBe("Today");
    expect(periodLabels[Period.LAST_7_DAYS]).toBe("Last 7 Days");
    expect(periodLabels[Period.ALL_TIME]).toBe("All time");
  });
});

describe("date formatting", () => {
  it("formats a full timestamp", () => {
    const date = new Date("2026-09-07T08:52:00Z");
    expect(formattedDate(date)).toBe(
      date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    );
  });

  it("joins both ends of a range", () => {
    const from = new Date("2026-09-07T08:52:00Z");
    const to = new Date("2026-09-14T09:00:00Z");

    expect(formattedDateRange(from, to)).toBe(`${formattedDate(from)} – ${formattedDate(to)}`);
    expect(formattedDateRangeShort(from, to)).toBe(
      `${formattedDateShort(from)} – ${formattedDateShort(to)}`,
    );
  });

  it("omits the year for the current year and includes it otherwise", () => {
    const currentYear = new Date().getFullYear();
    const thisYear = new Date(currentYear, 4, 3);
    const previousYear = new Date(currentYear - 1, 4, 3);

    expect(formattedDateShort(thisYear)).not.toContain(String(currentYear));
    expect(formattedDateShort(previousYear)).toContain(String(currentYear - 1));
  });
});

describe("cookies", () => {
  it("returns an empty string for a missing cookie", () => {
    expect(getCookie("does_not_exist")).toBe("");
  });

  it("round-trips a value", () => {
    setCookie("symbanta_selected_period", Period.LAST_30_DAYS);
    expect(getCookie("symbanta_selected_period")).toBe(Period.LAST_30_DAYS);
  });

  it("encodes values that need escaping", () => {
    setCookie("symbanta_selected_domain", "example.com/a b&c");
    expect(getCookie("symbanta_selected_domain")).toBe("example.com/a b&c");
  });

  it("does not confuse cookies with a shared prefix", () => {
    setCookie("symbanta_theme", "dark");
    setCookie("theme", "light");

    expect(getCookie("theme")).toBe("light");
    expect(getCookie("symbanta_theme")).toBe("dark");
  });
});
