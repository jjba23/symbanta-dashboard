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
 * The colour contract of the dashboard.
 *
 * `src/index.css` owns the *look* (gradients, alphas, shadows); this module
 * owns the *measurements*. Each entry below declares the worst-case material a
 * piece of text or an icon can sit on, the WCAG level it must reach, and the
 * Tailwind utilities that use it. `tokens.test.ts` recomputes every ratio and
 * `colorUsage.test.ts` fails the build when a new `text-*` utility appears in a
 * component without a matching declaration here.
 */

import {
  compositeStack,
  contrastRatio,
  meetsThreshold,
  thresholdFor,
  toCssColor,
  type ConformanceLevel,
  type TextUsage,
} from "./contrast.ts";

export type ThemeName = "light" | "dark";

export const THEMES: ThemeName[] = ["light", "dark"];

/** Tailwind palette values (https://tailwindcss.com/docs/colors). */
export const palette = {
  white: "#ffffff",
  stone50: "#fafaf9",
  stone100: "#f5f5f4",
  stone200: "#e7e5e4",
  stone300: "#d6d3d1",
  stone400: "#a8a29e",
  stone500: "#78716c",
  stone600: "#57534e",
  stone700: "#44403c",
  stone800: "#292524",
  stone900: "#1c1917",
  rose300: "#fda4af",
  rose400: "#fb7185",
  rose500: "#f43f5e",
  rose600: "#e11d48",
  rose700: "#be123c",
  sky100: "#e0f2fe",
  sky300: "#7dd3fc",
  sky600: "#0284c7",
  sky700: "#0369a1",
  amber100: "#fef3c7",
  amber300: "#fcd34d",
  amber600: "#d97706",
  amber700: "#b45309",
  amber800: "#92400e",
  violet100: "#ede9fe",
  violet300: "#c4b5fd",
  violet600: "#7c3aed",
  violet700: "#6d28d9",
  pink100: "#fce7f3",
  pink300: "#f9a8d4",
  pink600: "#db2777",
  red300: "#fca5a5",
  red600: "#dc2626",
} as const;

export type SurfaceName =
  | "wallpaper"
  | "glass"
  | "glassToolbar"
  | "glassInset"
  | "glassControl"
  | "roseTint"
  | "skyTint"
  | "amberTint"
  | "violetTint"
  | "tintSky"
  | "tintAmber"
  | "tintPink"
  | "tintViolet"
  | "primaryButton";

/**
 * Paint stacks ordered back to front, using the *least favourable* stop of
 * every gradient (the lightest one in dark mode, the darkest one in light
 * mode) and the thinnest alpha of every translucent material.
 */
export const surfaces: Record<ThemeName, Record<SurfaceName, string[]>> = {
  light: {
    // Darkest wallpaper stop (#ebe1da) — worst case for dark text.
    wallpaper: ["#ebe1da"],
    glass: ["#ebe1da", "rgba(255,255,255,0.77)"],
    glassToolbar: ["#ebe1da", "rgba(255,255,255,0.92)"],
    glassInset: ["#ebe1da", "rgba(255,255,255,0.77)", "rgba(250,246,243,0.6)"],
    glassControl: ["#ebe1da", "rgba(255,255,255,0.77)", "rgba(255,255,255,0.82)"],
    roseTint: ["#ebe1da", "rgba(255,255,255,0.77)", "rgba(244,63,94,0.1)"],
    skyTint: ["#ebe1da", "rgba(255,255,255,0.77)", "rgba(14,165,233,0.1)"],
    amberTint: ["#ebe1da", "rgba(255,255,255,0.77)", "rgba(245,158,11,0.15)"],
    violetTint: ["#ebe1da", "rgba(255,255,255,0.77)", "rgba(139,92,246,0.1)"],
    tintSky: [palette.sky100],
    tintAmber: [palette.amber100],
    tintPink: [palette.pink100],
    tintViolet: [palette.violet100],
    // Lightest stop of the primary button gradient (rose-600).
    primaryButton: [palette.rose600],
  },
  dark: {
    // Lightest wallpaper stop (#14100f) — worst case for light text.
    wallpaper: ["#14100f"],
    // Includes the dark fallback colour painted under the gradient.
    glass: ["#14100f", "rgba(28,25,23,0.72)", "rgba(255,255,255,0.045)"],
    glassToolbar: ["#14100f", "rgba(26,23,22,0.95)", "rgba(42,38,37,0.94)"],
    glassInset: [
      "#14100f",
      "rgba(28,25,23,0.72)",
      "rgba(255,255,255,0.045)",
      "rgba(255,255,255,0.025)",
    ],
    glassControl: ["#14100f", "rgba(38,34,33,0.9)", "rgba(255,255,255,0.13)"],
    roseTint: [
      "#14100f",
      "rgba(28,25,23,0.72)",
      "rgba(255,255,255,0.045)",
      "rgba(251,113,133,0.1)",
    ],
    skyTint: ["#14100f", "rgba(28,25,23,0.72)", "rgba(255,255,255,0.045)", "rgba(56,189,248,0.1)"],
    amberTint: [
      "#14100f",
      "rgba(28,25,23,0.72)",
      "rgba(255,255,255,0.045)",
      "rgba(251,191,36,0.1)",
    ],
    violetTint: [
      "#14100f",
      "rgba(28,25,23,0.72)",
      "rgba(255,255,255,0.045)",
      "rgba(167,139,250,0.1)",
    ],
    tintSky: ["#14100f", "rgba(28,25,23,0.72)", "rgba(255,255,255,0.045)", "rgba(14,165,233,0.15)"],
    tintAmber: [
      "#14100f",
      "rgba(28,25,23,0.72)",
      "rgba(255,255,255,0.045)",
      "rgba(245,158,11,0.1)",
    ],
    tintPink: [
      "#14100f",
      "rgba(28,25,23,0.72)",
      "rgba(255,255,255,0.045)",
      "rgba(236,72,153,0.15)",
    ],
    tintViolet: [
      "#14100f",
      "rgba(28,25,23,0.72)",
      "rgba(255,255,255,0.045)",
      "rgba(139,92,246,0.15)",
    ],
    primaryButton: [palette.rose600],
  },
};

/** Flatten a material into the opaque colour the user perceives. */
export function resolveSurface(theme: ThemeName, surface: SurfaceName): string {
  return toCssColor(compositeStack(surfaces[theme][surface]));
}

export type TextTokenName =
  | "heading"
  | "emphasis"
  | "body"
  | "secondary"
  | "muted"
  | "accent"
  | "accentStrong"
  | "accentHover"
  | "danger"
  | "info"
  | "warning"
  | "debug"
  | "iconAccentSky"
  | "iconAccentAmber"
  | "iconAccentPink"
  | "iconAccentViolet"
  | "primaryAction"
  | "decorative";

export interface TextTokenSpec {
  color: string;
  surface: SurfaceName;
  level: ConformanceLevel;
  usage: TextUsage;
  /** Tailwind colour utilities (minus any `dark:` prefix) painted with this colour. */
  classes: string[];
  description: string;
  /**
   * Marks that carry no information (bullet separators). They are allowed to
   * be faint, but must also be `aria-hidden`.
   */
  decorative?: boolean;
}

export const textTokens: Record<ThemeName, Partial<Record<TextTokenName, TextTokenSpec>>> = {
  light: {
    heading: {
      color: palette.stone900,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-900"],
      description: "Page and panel titles",
    },
    emphasis: {
      color: palette.stone800,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-800"],
      description: "Table cells and card headings",
    },
    body: {
      color: palette.stone700,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-700"],
      description: "Body copy and control labels",
    },
    secondary: {
      color: palette.stone600,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-600"],
      description: "Subtitles and supporting copy",
    },
    muted: {
      color: palette.stone500,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-500"],
      description: "Captions, timestamps and column headers",
    },
    accent: {
      color: palette.rose700,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["rose-700"],
      description: "Interactive hover state and inline errors",
    },
    accentStrong: {
      color: palette.rose700,
      surface: "roseTint",
      level: "AA",
      usage: "normal",
      classes: ["rose-700"],
      description: "Domain badge and error text",
    },
    danger: {
      color: palette.red600,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["red-600"],
      description: "Failed user load",
    },
    info: {
      color: palette.sky700,
      surface: "skyTint",
      level: "AA",
      usage: "normal",
      classes: ["sky-700"],
      description: "Info console-log badge",
    },
    warning: {
      color: palette.amber800,
      surface: "amberTint",
      level: "AA",
      usage: "normal",
      classes: ["amber-800"],
      description: "Warning console-log badge",
    },
    debug: {
      color: palette.violet700,
      surface: "violetTint",
      level: "AA",
      usage: "normal",
      classes: ["violet-700"],
      description: "Debug console-log badge",
    },
    iconAccentSky: {
      color: palette.sky600,
      surface: "tintSky",
      level: "AA",
      usage: "non-text",
      classes: ["sky-600"],
      description: "Average-visit stat icon",
    },
    iconAccentAmber: {
      color: palette.amber700,
      surface: "tintAmber",
      level: "AA",
      usage: "non-text",
      classes: ["amber-700"],
      description: "Bounce-rate stat icon",
    },
    iconAccentPink: {
      color: palette.pink600,
      surface: "tintPink",
      level: "AA",
      usage: "non-text",
      classes: ["pink-600"],
      description: "Unique-visitors stat icon",
    },
    iconAccentViolet: {
      color: palette.violet600,
      surface: "tintViolet",
      level: "AA",
      usage: "non-text",
      classes: ["violet-600"],
      description: "Page-views stat icon",
    },
    primaryAction: {
      color: palette.white,
      surface: "primaryButton",
      level: "AA",
      usage: "normal",
      classes: [],
      description: "Primary button label",
    },
    decorative: {
      color: palette.stone400,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-400"],
      description: "Bullet separators (must be aria-hidden)",
      decorative: true,
    },
  },
  dark: {
    heading: {
      color: palette.stone50,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-50", "stone-100"],
      description: "Page and panel titles",
    },
    emphasis: {
      color: palette.stone200,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-200"],
      description: "Table cells and card headings",
    },
    body: {
      color: palette.stone300,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-300"],
      description: "Body copy and control labels",
    },
    secondary: {
      color: palette.stone400,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-400"],
      description: "Subtitles, timestamps and column headers",
    },
    accent: {
      color: palette.rose300,
      surface: "roseTint",
      level: "AA",
      usage: "normal",
      classes: ["rose-300"],
      description: "Domain badge and error text",
    },
    accentHover: {
      color: palette.rose400,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["rose-400"],
      description: "Interactive hover state",
    },
    danger: {
      color: palette.red300,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["red-300"],
      description: "Failed user load",
    },
    info: {
      color: palette.sky300,
      surface: "skyTint",
      level: "AA",
      usage: "normal",
      classes: ["sky-300"],
      description: "Info console-log badge",
    },
    warning: {
      color: palette.amber300,
      surface: "amberTint",
      level: "AA",
      usage: "normal",
      classes: ["amber-300"],
      description: "Warning console-log badge",
    },
    debug: {
      color: palette.violet300,
      surface: "violetTint",
      level: "AA",
      usage: "normal",
      classes: ["violet-300"],
      description: "Debug console-log badge",
    },
    iconAccentSky: {
      color: palette.sky300,
      surface: "tintSky",
      level: "AA",
      usage: "non-text",
      classes: ["sky-300"],
      description: "Average-visit stat icon",
    },
    iconAccentAmber: {
      color: palette.amber300,
      surface: "tintAmber",
      level: "AA",
      usage: "non-text",
      classes: ["amber-300"],
      description: "Bounce-rate stat icon",
    },
    iconAccentPink: {
      color: palette.pink300,
      surface: "tintPink",
      level: "AA",
      usage: "non-text",
      classes: ["pink-300"],
      description: "Unique-visitors stat icon",
    },
    iconAccentViolet: {
      color: palette.violet300,
      surface: "tintViolet",
      level: "AA",
      usage: "non-text",
      classes: ["violet-300"],
      description: "Page-views stat icon",
    },
    primaryAction: {
      color: palette.white,
      surface: "primaryButton",
      level: "AA",
      usage: "normal",
      classes: [],
      description: "Primary button label",
    },
    decorative: {
      color: palette.stone600,
      surface: "glass",
      level: "AA",
      usage: "normal",
      classes: ["stone-600"],
      description: "Bullet separators (must be aria-hidden)",
      decorative: true,
    },
  },
};

export interface ColorPair {
  theme: ThemeName;
  token: TextTokenName;
  foreground: string;
  surface: SurfaceName;
  required: number;
  level: ConformanceLevel;
  usage: TextUsage;
  description: string;
  decorative: boolean;
}

export interface ContrastMeasurement extends ColorPair {
  background: string;
  ratio: number;
  passes: boolean;
}

/** Every declared text/icon colour, flattened into measurable pairs. */
export function buildColorPairs(): ColorPair[] {
  const pairs: ColorPair[] = [];

  for (const theme of THEMES) {
    const specs = textTokens[theme];

    for (const token of Object.keys(specs) as TextTokenName[]) {
      const spec = specs[token];
      if (!spec) continue;

      pairs.push({
        theme,
        token,
        foreground: spec.color,
        surface: spec.surface,
        required: thresholdFor(spec.level, spec.usage),
        level: spec.level,
        usage: spec.usage,
        description: spec.description,
        decorative: spec.decorative === true,
      });
    }
  }

  return pairs;
}

/** Measure every pair, including decorative ones (which are exempt below). */
export function measureColorPairs(pairs: ColorPair[] = buildColorPairs()): ContrastMeasurement[] {
  return pairs.map((pair) => {
    const background = resolveSurface(pair.theme, pair.surface);
    const ratio = contrastRatio(pair.foreground, background);

    return {
      ...pair,
      background,
      ratio,
      passes: pair.decorative || meetsThreshold(ratio, pair.required),
    };
  });
}

export function failingColorPairs(pairs: ColorPair[] = buildColorPairs()): ContrastMeasurement[] {
  return measureColorPairs(pairs).filter((measurement) => !measurement.passes);
}

/**
 * Tailwind utility → declared token. `text-stone-500` in light mode and
 * `dark:stone-500` are deliberately separate: the same utility can be readable
 * in one theme and unreadable in the other.
 */
export const TEXT_CLASS_TOKENS: Record<ThemeName, Record<string, TextTokenName[]>> = {
  light: {},
  dark: {},
};

for (const theme of THEMES) {
  for (const [token, spec] of Object.entries(textTokens[theme]) as Array<
    [TextTokenName, TextTokenSpec | undefined]
  >) {
    if (!spec) continue;
    for (const className of spec.classes) {
      const bucket = TEXT_CLASS_TOKENS[theme][className] ?? [];
      if (!bucket.includes(token)) bucket.push(token);
      TEXT_CLASS_TOKENS[theme][className] = bucket;
    }
  }
}

/** Look up the declarations behind a utility class such as `stone-500`. */
export function findTextTokens(theme: ThemeName, className: string): TextTokenName[] {
  return TEXT_CLASS_TOKENS[theme][className] ?? [];
}
