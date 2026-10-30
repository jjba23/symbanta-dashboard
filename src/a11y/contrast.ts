// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

/**
 * Colour math for WCAG 2.1 contrast (1.4.3 / 1.4.6 / 1.4.11).
 *
 * The dashboard is built out of translucent materials, so a plain foreground /
 * background comparison is not enough: the frosted panels are *stacked*
 * layers painted over the wallpaper. `compositeStack` folds such a stack into
 * the opaque colour the user actually perceives, and `contrastRatio` then
 * applies the official relative-luminance formula.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Rgba extends Rgb {
  a: number;
}

export type ColorInput = string | Rgba;

/** WCAG 2.1 minimum contrast ratios. */
export const WCAG_THRESHOLDS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
  /** Non-text UI components and graphical objects (1.4.11). */
  NON_TEXT: 3,
} as const;

export type ConformanceLevel = "AA" | "AAA";
export type TextSize = "normal" | "large";
export type TextUsage = TextSize | "non-text";

const HEX_PATTERN = /^#([0-9a-f]{3,8})$/i;
const FUNCTIONAL_PATTERN = /^rgba?\(([^)]+)\)$/i;

function clamp(value: number, min = 0, max = 255): number {
  return Math.min(max, Math.max(min, value));
}

function parseChannel(raw: string): number {
  const value = raw.trim();
  if (value.endsWith("%")) {
    return clamp((Number.parseFloat(value) / 100) * 255);
  }
  return clamp(Number.parseFloat(value));
}

function parseHex(digits: string): Rgba {
  if (digits.length === 3 || digits.length === 4) {
    const expanded = digits
      .split("")
      .map((digit) => digit + digit)
      .join("");
    return parseHex(expanded);
  }

  if (digits.length !== 6 && digits.length !== 8) {
    throw new Error(`Unsupported hex colour: #${digits}`);
  }

  const red = Number.parseInt(digits.slice(0, 2), 16);
  const green = Number.parseInt(digits.slice(2, 4), 16);
  const blue = Number.parseInt(digits.slice(4, 6), 16);
  const alpha = digits.length === 8 ? Number.parseInt(digits.slice(6, 8), 16) / 255 : 1;

  return { r: red, g: green, b: blue, a: alpha };
}

/**
 * Parse `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb(...)`, `rgba(...)`
 * (comma or space separated, with an optional `/ alpha`) and `transparent`.
 */
export function parseColor(input: ColorInput): Rgba {
  if (typeof input !== "string") {
    return {
      r: clamp(input.r),
      g: clamp(input.g),
      b: clamp(input.b),
      a: clamp(input.a, 0, 1),
    };
  }

  const value = input.trim().toLowerCase();

  if (value === "" || value === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const hexMatch = HEX_PATTERN.exec(value);
  if (hexMatch?.[1]) {
    return parseHex(hexMatch[1]);
  }

  const functionalMatch = FUNCTIONAL_PATTERN.exec(value);
  if (functionalMatch?.[1]) {
    const parts = functionalMatch[1]
      .split(/[\s,/]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    const [red, green, blue, alpha] = parts;

    if (red === undefined || green === undefined || blue === undefined) {
      throw new Error(`Unsupported colour: ${input}`);
    }

    return {
      r: parseChannel(red),
      g: parseChannel(green),
      b: parseChannel(blue),
      a: alpha === undefined ? 1 : clamp(Number.parseFloat(alpha), 0, 1),
    };
  }

  throw new Error(`Unsupported colour: ${input}`);
}

export function toHex(color: ColorInput): string {
  const { r, g, b } = parseColor(color);
  const hex = (channel: number) => Math.round(clamp(channel)).toString(16).padStart(2, "0");

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function toCssColor(color: ColorInput): string {
  const parsed = parseColor(color);
  if (parsed.a >= 1) {
    return toHex(parsed);
  }
  const round = (channel: number) => Math.round(clamp(channel) * 100) / 100;
  return `rgba(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)}, ${round(parsed.a)})`;
}

/** Source-over alpha compositing of `foreground` on top of `backdrop`. */
export function composite(foreground: ColorInput, backdrop: ColorInput): Rgba {
  const top = parseColor(foreground);
  const bottom = parseColor(backdrop);
  const alpha = top.a + bottom.a * (1 - top.a);

  if (alpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const blend = (topChannel: number, bottomChannel: number) =>
    (topChannel * top.a + bottomChannel * bottom.a * (1 - top.a)) / alpha;

  return {
    r: blend(top.r, bottom.r),
    g: blend(top.g, bottom.g),
    b: blend(top.b, bottom.b),
    a: alpha,
  };
}

/**
 * Flatten a paint stack ordered **back to front** (the same order CSS paints
 * them) into one opaque colour. The bottom-most layer must be opaque.
 */
export function compositeStack(layers: ColorInput[]): Rgba {
  const first = layers[0];
  if (first === undefined) {
    throw new Error("compositeStack needs at least one layer");
  }

  const base = parseColor(first);
  if (base.a < 1) {
    throw new Error("The bottom-most layer must be opaque");
  }

  return layers.slice(1).reduce<Rgba>((backdrop, layer) => composite(layer, backdrop), base);
}

/** WCAG 2.1 relative luminance, https://www.w3.org/TR/WCAG21/#dfn-relative-luminance */
export function relativeLuminance(color: ColorInput): number {
  const { r, g, b } = parseColor(color);

  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: ColorInput, background: ColorInput): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function thresholdFor(level: ConformanceLevel, usage: TextUsage): number {
  if (usage === "non-text") {
    return WCAG_THRESHOLDS.NON_TEXT;
  }

  if (level === "AAA") {
    return usage === "large" ? WCAG_THRESHOLDS.AAA_LARGE : WCAG_THRESHOLDS.AAA_NORMAL;
  }

  return usage === "large" ? WCAG_THRESHOLDS.AA_LARGE : WCAG_THRESHOLDS.AA_NORMAL;
}

export function meetsThreshold(ratio: number, required: number): boolean {
  // Guard against floating point noise at the exact boundary (4.499999, ...).
  return ratio + 1e-9 >= required;
}

/** "4.83:1" — always two decimals, the way audit tools report it. */
export function ratioLabel(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}
