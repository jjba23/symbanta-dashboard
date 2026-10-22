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
 * Deterministic demo analytics.
 *
 * Every number here is derived from a seeded PRNG keyed by `domain + period`,
 * so the dashboard looks alive (traffic curves, long-tail tables, occasional
 * console errors) while staying perfectly reproducible: reopening the page,
 * refreshing, or restarting the mock server always shows the same figures.
 */

import type {
  ConsoleLogLevel,
  TimeSeriesPoint,
  V1ConsoleLogEntry,
  V1CountryStat,
  V1EventStat,
  V1EventType,
  V1Property,
  V1RouteStat,
  V1ScreenSizeStat,
  V1StatsSummaryResponse,
  V1TimeSeriesStatsResponse,
  V1TimeSeriesStatsResponseGranularity,
  V1UserAgentStat,
} from "../src/api/model/index.ts";

const DAY = 86_400_000;

export interface PeriodWindow {
  granularity: V1TimeSeriesStatsResponseGranularity;
  from: Date;
  to: Date;
  /** Number of time buckets to generate. */
  buckets: number;
}

export interface DatasetOptions {
  /** Return a well-formed but empty dataset (for empty-state work). */
  empty?: boolean;
  now?: Date;
}

export interface MockDataset {
  domain: string;
  window: PeriodWindow;
  summary: V1StatsSummaryResponse;
  timeSeries: V1TimeSeriesStatsResponse;
  routes: V1RouteStat[];
  screenSizes: V1ScreenSizeStat[];
  userAgents: V1UserAgentStat[];
  events: V1EventStat[];
  countries: V1CountryStat[];
  logs: V1ConsoleLogEntry[];
  eventTypes: V1EventType[];
}

const ROUTES = [
  "/",
  "/pricing",
  "/blog/privacy-friendly-analytics",
  "/docs/install",
  "/docs/api",
  "/changelog",
  "/about",
];

const COUNTRIES = ["ES", "DE", "US", "FR", "NL", "GB", "JP", "BR", "CA", "ZZ"];

const SCREEN_SIZES = [
  "1920x1080",
  "2560x1440",
  "1440x900",
  "1366x768",
  "768x1024",
  "430x932",
  "390x844",
];

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.2792.65",
];

const EVENT_TEMPLATES: Array<Pick<V1EventType, "name" | "description">> = [
  { name: "signup-click", description: "Visitor pressed the primary signup button." },
  { name: "checkout-start", description: "Checkout flow was started." },
  { name: "newsletter-subscribe", description: "Newsletter subscription form submitted." },
  { name: "docs-search", description: "A search query was run in the documentation." },
];

const LOG_TEMPLATES: Array<Pick<V1ConsoleLogEntry, "level" | "message" | "url">> = [
  { level: "info", message: "Service worker registered", url: "/" },
  { level: "warn", message: "Slow network request: /v1/stats/summary took 1840ms", url: "/" },
  { level: "error", message: "Unhandled rejection: TypeError: cannot read properties of null" },
  { level: "log", message: "Beacon flushed (3 events)", url: "/pricing" },
  { level: "debug", message: "Analytics queue drained in 12ms", url: "/docs/api" },
  { level: "info", message: "Theme preference applied: dark", url: "/" },
  { level: "warn", message: "Missing alt text on image in blog header", url: "/blog" },
  { level: "error", message: "Failed to POST /v1/events/register (503)", url: "/docs/install" },
];

const LOG_LEVELS: ConsoleLogLevel[] = ["log", "info", "warn", "error", "debug"];

/** 32-bit string hash (FNV-1a), used to seed the PRNG per domain + period. */
export function hashString(value: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

/** Small, fast, deterministic PRNG (mulberry32). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;

    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Resolve a period name (`LAST_7_DAYS`, `TODAY`, …) into a concrete window and
 * the time-bucket size the chart should use. Unknown periods fall back to the
 * dashboard's default of seven days.
 */
export function periodWindow(period: string | undefined, now: Date = new Date()): PeriodWindow {
  const to = new Date(now);

  switch (period) {
    case "TODAY":
      return {
        granularity: "HOUR",
        from: startOfDay(now),
        to,
        buckets: Math.max(1, now.getHours() + 1),
      };
    case "YESTERDAY": {
      const from = startOfDay(new Date(now.getTime() - DAY));
      return { granularity: "HOUR", from, to: new Date(from.getTime() + DAY - 1), buckets: 24 };
    }
    case "LAST_24_HOURS":
      return { granularity: "HOUR", from: new Date(now.getTime() - DAY), to, buckets: 24 };
    case "LAST_3_DAYS":
      return { granularity: "DAY", from: new Date(now.getTime() - 3 * DAY), to, buckets: 3 };
    case "LAST_30_DAYS":
      return { granularity: "DAY", from: new Date(now.getTime() - 30 * DAY), to, buckets: 30 };
    case "THIS_MONTH": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        granularity: "DAY",
        from,
        to,
        buckets: Math.max(1, Math.ceil((to.getTime() - from.getTime()) / DAY)),
      };
    }
    case "LAST_MONTH": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        granularity: "DAY",
        from,
        to: end,
        buckets: Math.ceil((end.getTime() - from.getTime()) / DAY),
      };
    }
    case "LAST_6_MONTHS":
      return { granularity: "DAY", from: new Date(now.getTime() - 182 * DAY), to, buckets: 30 };
    case "LAST_12_MONTHS":
      return { granularity: "DAY", from: new Date(now.getTime() - 365 * DAY), to, buckets: 52 };
    case "THIS_YEAR": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { granularity: "DAY", from, to, buckets: 30 };
    }
    case "LAST_YEAR": {
      const from = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { granularity: "DAY", from, to: end, buckets: 30 };
    }
    case "ALL_TIME":
      return { granularity: "DAY", from: new Date(now.getTime() - 365 * DAY), to, buckets: 30 };
    case "LAST_7_DAYS":
    default:
      return { granularity: "DAY", from: new Date(now.getTime() - 7 * DAY), to, buckets: 7 };
  }
}

/** Build a custom window from `YYYY-MM-DD` bounds, falling back to 7 days. */
export function customWindow(
  startDate: string | null,
  endDate: string | null,
  now: Date = new Date(),
): PeriodWindow {
  const from = startDate ? new Date(`${startDate}T00:00:00`) : new Date(now.getTime() - 7 * DAY);
  const to = endDate ? new Date(`${endDate}T23:59:59`) : new Date(now);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return periodWindow("LAST_7_DAYS", now);
  }

  const span = to.getTime() - from.getTime();
  const buckets = Math.max(1, Math.min(60, Math.ceil(span / DAY)));

  return { granularity: span <= DAY ? "HOUR" : "DAY", from, to, buckets };
}

/** Split a total into `count` weighted parts that add up to exactly `total`. */
function splitTotal(total: number, count: number, random: () => number): number[] {
  if (count <= 0) return [];
  if (total <= 0) return Array.from({ length: count }, () => 0);

  const weights = Array.from({ length: count }, () => 0.35 + random());
  const sum = weights.reduce((accumulator, weight) => accumulator + weight, 0);
  const parts = weights.map((weight) => Math.floor((weight / sum) * total));

  // Hand the rounding remainder to the biggest buckets so the panels always
  // add up to the summary total.
  const remainder = total - parts.reduce((accumulator, part) => accumulator + part, 0);
  const order = parts
    .map((part, index) => ({ part, index }))
    .sort((left, right) => right.part - left.part);

  for (let offset = 0; offset < remainder; offset += 1) {
    const target = order[offset % count];
    if (target === undefined) break;
    parts[target.index] = (parts[target.index] ?? 0) + 1;
  }

  return parts;
}

export function demoProperties(now: Date = new Date()): V1Property[] {
  const createdAt = new Date(now.getTime() - 180 * DAY).toISOString();

  return [
    { id: "prop-example", domain: "example.com", createdAt },
    { id: "prop-docs", domain: "docs.example.com", createdAt },
    { id: "prop-local", domain: "localhost", createdAt },
  ];
}

export function demoEventTypes(
  domain: string,
  now: Date = new Date(),
  random: () => number = seededRandom(hashString(domain)),
): V1EventType[] {
  const count = 2 + Math.floor(random() * (EVENT_TEMPLATES.length - 1));

  return EVENT_TEMPLATES.slice(0, count).map((template, index) => ({
    id: `evt-${hashString(`${domain}:${template.name}`).toString(16)}`,
    name: template.name,
    ...(template.description === undefined ? {} : { description: template.description }),
    createdAt: new Date(now.getTime() - (index + 1) * 3 * DAY).toISOString(),
  }));
}

function buildLogs(
  domain: string,
  window: PeriodWindow,
  random: () => number,
  empty: boolean,
): V1ConsoleLogEntry[] {
  if (empty) return [];

  const count = 32;

  return Array.from({ length: count }, (_, index) => {
    const template = LOG_TEMPLATES[index % LOG_TEMPLATES.length] ?? LOG_TEMPLATES[0];
    const level =
      index % 11 === 0 && random() > 0.5
        ? (LOG_LEVELS[index % LOG_LEVELS.length] ?? "log")
        : undefined;

    return {
      timestamp: new Date(window.to.getTime() - index * 137_000 * (1 + random())).toISOString(),
      level: level ?? template?.level ?? "log",
      message: template?.message ?? "No message",
      ...(template?.url === undefined ? {} : { url: template.url }),
      sessionId: `sess-${hashString(`${domain}:${index}`).toString(16).slice(0, 8)}`,
      country: COUNTRIES[index % COUNTRIES.length] ?? "ZZ",
    };
  });
}

/** Build the full dataset the dashboard renders for a domain and period. */
export function createDataset(
  domain: string,
  period: string | undefined,
  options: DatasetOptions = {},
  window: PeriodWindow = periodWindow(period, options.now ?? new Date()),
): MockDataset {
  const empty = options.empty === true;
  const random = seededRandom(hashString(`${domain}|${period ?? "LAST_7_DAYS"}|${window.buckets}`));

  const spanMs = window.to.getTime() - window.from.getTime();
  const stepMs = window.buckets > 1 ? spanMs / (window.buckets - 1) : 0;
  const baseVolume = window.granularity === "HOUR" ? 38 : 420;

  const points: TimeSeriesPoint[] = Array.from({ length: window.buckets }, (_, index) => {
    const timestamp = new Date(window.from.getTime() + index * stepMs);
    // A gentle weekly wave keeps the chart readable instead of pure noise.
    const wave = 1 + 0.28 * Math.sin((index / Math.max(1, window.buckets)) * Math.PI * 2);
    const views = empty ? 0 : round(baseVolume * wave * (0.65 + random() * 0.75));
    const visitors = empty ? 0 : Math.max(1, round(views * (0.3 + random() * 0.22)));

    return { timestamp: timestamp.toISOString(), pageViews: views, visitors };
  });

  const pageViews = points.reduce((total, point) => total + point.pageViews, 0);
  const visitors = empty ? 0 : Math.round(pageViews * (0.28 + random() * 0.12));

  const summary: V1StatsSummaryResponse = {
    from: window.from.toISOString(),
    to: window.to.toISOString(),
    pageViews,
    visitors,
    bounceRate: empty ? 0 : round(22 + random() * 28, 2),
    averageDurationMillis: empty ? 0 : Math.round((45 + random() * 210) * 1000),
  };

  const routeParts = splitTotal(pageViews, ROUTES.length, random);
  const routes: V1RouteStat[] = ROUTES.map((route, index) => ({
    route,
    pageViews: routeParts[index] ?? 0,
    visitors: Math.round((routeParts[index] ?? 0) * (0.35 + random() * 0.25)),
  })).sort((left, right) => right.pageViews - left.pageViews);

  const screenParts = splitTotal(pageViews, SCREEN_SIZES.length, random);
  const screenSizes: V1ScreenSizeStat[] = SCREEN_SIZES.map((size, index) => ({
    size,
    pageViews: screenParts[index] ?? 0,
    visitors: Math.round((screenParts[index] ?? 0) * (0.4 + random() * 0.2)),
  })).sort((left, right) => right.pageViews - left.pageViews);

  const agentParts = splitTotal(pageViews, USER_AGENTS.length, random);
  const userAgents: V1UserAgentStat[] = USER_AGENTS.map((userAgent, index) => ({
    userAgent,
    pageViews: agentParts[index] ?? 0,
    visitors: Math.round((agentParts[index] ?? 0) * (0.38 + random() * 0.18)),
  })).sort((left, right) => right.pageViews - left.pageViews);

  const eventTypes = empty ? [] : demoEventTypes(domain, options.now ?? new Date(), random);
  const events: V1EventStat[] = eventTypes.map((eventType) => ({
    eventName: eventType.name,
    occurrences: Math.round(pageViews * (0.01 + random() * 0.06)),
    visitors: Math.round(visitors * (0.01 + random() * 0.04)),
  }));

  const countryParts = splitTotal(pageViews, COUNTRIES.length, random);
  const countries: V1CountryStat[] = COUNTRIES.map((country, index) => ({
    country,
    pageViews: countryParts[index] ?? 0,
    visitors: Math.round((countryParts[index] ?? 0) * (0.4 + random() * 0.2)),
  })).sort((left, right) => right.pageViews - left.pageViews);

  return {
    domain,
    window,
    summary,
    timeSeries: {
      granularity: window.granularity,
      from: window.from.toISOString(),
      to: window.to.toISOString(),
      points,
    },
    routes,
    screenSizes,
    userAgents,
    events,
    countries,
    logs: buildLogs(domain, window, random, empty),
    eventTypes,
  };
}
