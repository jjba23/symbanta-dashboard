// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { describe, expect, it } from "vitest";
import {
  WCAG_THRESHOLDS,
  composite,
  compositeStack,
  contrastRatio,
  meetsThreshold,
  parseColor,
  ratioLabel,
  relativeLuminance,
  thresholdFor,
  toCssColor,
  toHex,
} from "./contrast.ts";

describe("parseColor", () => {
  it("expands short hex notation", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("#0af")).toEqual({ r: 0, g: 170, b: 255, a: 1 });
  });

  it("reads alpha from #rrggbbaa", () => {
    expect(parseColor("#1c191780").a).toBeCloseTo(128 / 255, 4);
  });

  it("parses the CSS colour function syntax used by the glass tokens", () => {
    expect(parseColor("rgb(255 255 255 / 0.77)")).toEqual({
      r: 255,
      g: 255,
      b: 255,
      a: 0.77,
    });
    expect(parseColor("rgba(255,255,255,0.045)")).toEqual({
      r: 255,
      g: 255,
      b: 255,
      a: 0.045,
    });
    expect(parseColor("rgb(120, 113, 108)")).toEqual({ r: 120, g: 113, b: 108, a: 1 });
  });

  it("treats transparent as fully see-through black", () => {
    expect(parseColor("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it("rejects colours it does not understand instead of guessing", () => {
    expect(() => parseColor("oklab(0.5 0.1 0.1)")).toThrow(/Unsupported colour/);
    expect(() => parseColor("#12345")).toThrow(/Unsupported/);
  });
});

describe("toHex / toCssColor", () => {
  it("round-trips opaque colours", () => {
    expect(toHex("#1c1917")).toBe("#1c1917");
    expect(toHex("rgb(255, 255, 255)")).toBe("#ffffff");
  });

  it("keeps alpha in the CSS representation", () => {
    expect(toCssColor("rgba(255,255,255,0.5)")).toBe("rgba(255, 255, 255, 0.5)");
    expect(toCssColor("#ebe1da")).toBe("#ebe1da");
  });
});

describe("alpha compositing", () => {
  it("mixes a translucent white over black to mid grey", () => {
    const mixed = composite("rgba(255,255,255,0.5)", "#000000");
    expect(Math.round(mixed.r)).toBe(128);
    expect(mixed.a).toBe(1);
  });

  it("folds a back-to-front stack, ignoring alpha ordering mistakes", () => {
    const flat = compositeStack(["#000000", "rgba(255,255,255,0.5)", "rgba(255,255,255,0.5)"]);
    // 50% white over black = 127.5, 50% white over that = 191.25
    expect(flat.r).toBeCloseTo(191.25, 2);
  });

  it("refuses a translucent bottom layer, which would be ambiguous", () => {
    expect(() => compositeStack(["rgba(0,0,0,0.5)"])).toThrow(/opaque/);
    expect(() => compositeStack([])).toThrow(/at least one layer/);
  });
});

describe("contrastRatio", () => {
  it("returns the canonical extremes", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("matches the published reference values", () => {
    // WebAIM: #767676 on #ffffff = 4.54:1, the classic AA boundary colour.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    // #777777 on white is the well-known 4.48:1 "almost AA" pair.
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#1c1917", "#fafaf9")).toBeCloseTo(
      contrastRatio("#fafaf9", "#1c1917"),
      10,
    );
  });

  it("applies the WCAG piecewise relative-luminance curve", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
    // 0x0A = 10 → below the 0.03928 knee, so the linear segment applies.
    expect(relativeLuminance("#0a0a0a")).toBeCloseTo(10 / 255 / 12.92, 10);
  });
});

describe("thresholds", () => {
  it("maps WCAG levels and text sizes to ratios", () => {
    expect(thresholdFor("AA", "normal")).toBe(WCAG_THRESHOLDS.AA_NORMAL);
    expect(thresholdFor("AA", "large")).toBe(WCAG_THRESHOLDS.AA_LARGE);
    expect(thresholdFor("AAA", "normal")).toBe(WCAG_THRESHOLDS.AAA_NORMAL);
    expect(thresholdFor("AAA", "large")).toBe(WCAG_THRESHOLDS.AAA_LARGE);
    expect(thresholdFor("AA", "non-text")).toBe(WCAG_THRESHOLDS.NON_TEXT);
  });

  it("accepts exact boundaries and rejects just below them", () => {
    expect(meetsThreshold(4.5, 4.5)).toBe(true);
    expect(meetsThreshold(4.4999, 4.5)).toBe(false);
  });

  it("formats ratios the way audits report them", () => {
    expect(ratioLabel(4.6969)).toBe("4.70:1");
  });
});
