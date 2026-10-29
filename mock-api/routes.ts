// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

/**
 * A dependency-free, in-memory implementation of the symbanta API.
 *
 * It is deliberately *pure*: `handle(method, url, body)` returns a plain
 * `{ status, headers, body }` object, which makes the whole API testable
 * without opening a socket. `plugin.ts` mounts it as Vite middleware (so
 * `npm run dev` works with no backend) and `server.ts` serves it standalone on
 * its own port.
 *
 * Every route mirrors the shapes produced by the OpenAPI document, including
 * RFC 7807 problem details for failures.
 */

import type {
  AuthResponse,
  MessageResponse,
  V1EventType,
  V1ProblemDetails,
} from "../src/api/model/index.ts";
import {
  createDataset,
  customWindow,
  demoEventTypes,
  demoProperties,
  hashString,
  periodWindow,
  type MockDataset,
} from "./fixtures.ts";

export const MOCK_BASE_PATH = "/mock-api";
export const SESSION_COOKIE = "symbanta_session";

/** Domain used when the dashboard has not picked a property yet. */
export const DEFAULT_DOMAIN = "example.com";

export interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface MockApiOptions {
  /** Artificial latency, so loading skeletons are visible during development. */
  latencyMs?: number;
  /** Answer every data request with this status (e.g. 401 or 500). */
  faultStatus?: number;
  /** Serve well-formed but empty datasets (empty-state work). */
  empty?: boolean;
  /** Injectable clock, for deterministic tests. */
  now?: () => Date;
}

export interface MockApi {
  handle(method: string, rawUrl: string, body?: unknown): MockResponse;
  /** Forget registered event types and the request counter. */
  reset(): void;
}

const JSON_HEADERS: Record<string, string> = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const EVENT_NAME_PATTERN = /^[A-Za-z0-9._:-]{1,120}$/;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_LOG_LIMIT = 1000;

function json(body: unknown, status = 200, headers: Record<string, string> = {}): MockResponse {
  return { status, headers: { ...JSON_HEADERS, ...headers }, body };
}

function problem(status: number, title: string, detail?: string): MockResponse {
  const body: V1ProblemDetails = {
    type: "about:blank",
    title,
    ...(detail === undefined ? {} : { detail }),
  };

  return json(body, status);
}

/** Split a request URL into the API path and its query parameters. */
export function parseRequestUrl(rawUrl: string): {
  pathname: string;
  params: URLSearchParams;
} {
  const url = new URL(rawUrl, "http://mock-api.local");
  const pathname = url.pathname.replace(new RegExp(`^${MOCK_BASE_PATH}(?=/|$)`), "");

  return { pathname: pathname === "" ? "/" : pathname, params: url.searchParams };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Translate the `MOCK_API_*` environment variables into options. Both the Vite
 * plugin and the standalone server use this so they behave identically.
 */
export function mockOptionsFromEnv(env: Record<string, string | undefined>): MockApiOptions {
  const latency = Number(env["MOCK_API_LATENCY_MS"]);
  const fault = Number(env["MOCK_API_FAULT"]);

  return {
    ...(Number.isFinite(latency) && latency >= 0 ? { latencyMs: latency } : {}),
    ...(Number.isFinite(fault) && fault >= 100 ? { faultStatus: fault } : {}),
    ...(env["MOCK_API_EMPTY"] === "1" || env["MOCK_API_EMPTY"] === "true" ? { empty: true } : {}),
  };
}

export function createMockApi(options: MockApiOptions = {}): MockApi {
  const eventTypesByDomain = new Map<string, V1EventType[]>();
  let requestCount = 0;

  const now = () => options.now?.() ?? new Date();

  function ensureEventTypes(domain: string): V1EventType[] {
    const existing = eventTypesByDomain.get(domain);
    if (existing) return existing;

    const seeded = demoEventTypes(domain, now());
    eventTypesByDomain.set(domain, seeded);
    return seeded;
  }

  function datasetFor(params: URLSearchParams): MockDataset {
    const domain = params.get("domain")?.trim() || DEFAULT_DOMAIN;
    const period = params.get("period") ?? undefined;
    const window =
      period === "CUSTOM"
        ? customWindow(params.get("start-date"), params.get("end-date"), now())
        : periodWindow(period, now());

    const dataset = createDataset(
      domain,
      period,
      { empty: options.empty === true, now: now() },
      window,
    );

    return { ...dataset, eventTypes: ensureEventTypes(domain) };
  }

  function registerEventType(body: unknown): MockResponse {
    const payload = asRecord(body);
    const name = typeof payload["name"] === "string" ? payload["name"].trim() : "";
    const domain =
      typeof payload["domain"] === "string" && payload["domain"].trim().length > 0
        ? payload["domain"].trim()
        : DEFAULT_DOMAIN;
    const description =
      typeof payload["description"] === "string" ? payload["description"].trim() : "";

    if (!EVENT_NAME_PATTERN.test(name)) {
      return problem(
        400,
        "Invalid event name",
        "Event names must be 1-120 letters, digits or - _ . : characters.",
      );
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return problem(
        400,
        "Description too long",
        `Descriptions are limited to ${MAX_DESCRIPTION_LENGTH} characters.`,
      );
    }

    const eventTypes = ensureEventTypes(domain);
    const existing = eventTypes.find((eventType) => eventType.name === name);
    if (existing) {
      // Registration is idempotent in the real API too.
      return json(existing);
    }

    const created: V1EventType = {
      id: `evt-${hashString(`${domain}:${name}`).toString(16)}`,
      name,
      ...(description.length > 0 ? { description } : {}),
      createdAt: now().toISOString(),
    };

    eventTypes.unshift(created);
    return json(created, 201);
  }

  function handle(method: string, rawUrl: string, body?: unknown): MockResponse {
    const verb = method.toUpperCase();
    const { pathname, params } = parseRequestUrl(rawUrl);
    requestCount += 1;

    if (verb === "OPTIONS") {
      return { status: 204, headers: {}, body: undefined };
    }

    if (pathname === "/" || pathname === "/health") {
      return json({ status: "ok", mock: true, requests: requestCount });
    }

    if (options.faultStatus !== undefined && options.faultStatus >= 100) {
      return problem(
        options.faultStatus,
        "Simulated mock failure",
        `MOCK_API_FAULT=${options.faultStatus}: every data route fails on purpose. Unset it to get demo data again.`,
      );
    }

    switch (`${verb} ${pathname}`) {
      case "GET /auth/me": {
        const user: AuthResponse = { username: "demo", role: "admin" };
        return json(user);
      }

      case "POST /auth/login": {
        const user: AuthResponse = { username: "demo", role: "admin" };
        return json(user, 200, {
          "set-cookie": `${SESSION_COOKIE}=mock-session; Path=/; HttpOnly; SameSite=Lax`,
        });
      }

      case "POST /auth/logout": {
        const message: MessageResponse = { message: "Session cleared" };
        return json(message, 200, {
          "set-cookie": `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
        });
      }

      case "GET /v1/properties":
        return json({ properties: demoProperties(now()) });

      case "GET /v1/stats/summary":
        return json(datasetFor(params).summary);

      case "GET /v1/stats/timeseries":
        return json(datasetFor(params).timeSeries);

      case "GET /v1/stats/routes": {
        const dataset = datasetFor(params);
        return json({ from: dataset.summary.from, to: dataset.summary.to, items: dataset.routes });
      }

      case "GET /v1/stats/screen-sizes": {
        const dataset = datasetFor(params);
        return json({
          from: dataset.summary.from,
          to: dataset.summary.to,
          items: dataset.screenSizes,
        });
      }

      case "GET /v1/stats/user-agents": {
        const dataset = datasetFor(params);
        return json({
          from: dataset.summary.from,
          to: dataset.summary.to,
          items: dataset.userAgents,
        });
      }

      case "GET /v1/stats/events": {
        const dataset = datasetFor(params);
        return json({ from: dataset.summary.from, to: dataset.summary.to, items: dataset.events });
      }

      case "GET /v1/stats/countries": {
        const dataset = datasetFor(params);
        return json({
          from: dataset.summary.from,
          to: dataset.summary.to,
          items: dataset.countries,
        });
      }

      case "GET /v1/logs": {
        const dataset = datasetFor(params);
        const requestedLimit = Number(params.get("limit") ?? "100");
        const limit = clamp(
          Number.isFinite(requestedLimit) ? requestedLimit : 100,
          1,
          MAX_LOG_LIMIT,
        );
        const level = params.get("level");
        const items = dataset.logs
          .filter((entry) => level === null || entry.level === level)
          .slice(0, limit);

        return json({ items });
      }

      case "GET /v1/event-types": {
        const domain = params.get("domain")?.trim() || DEFAULT_DOMAIN;
        return json({ eventTypes: ensureEventTypes(domain) });
      }

      case "POST /v1/event-types":
        return registerEventType(body);

      case "POST /v1/events/register":
        return json({ message: "Event accepted (mock)" }, 202);

      default:
        if (pathname.startsWith("/v1/") || pathname.startsWith("/auth/")) {
          return problem(404, "No such mock endpoint", `${verb} ${pathname}`);
        }
        return problem(404, "No such route", `${verb} ${pathname}`);
    }
  }

  return {
    handle,
    reset() {
      eventTypesByDomain.clear();
      requestCount = 0;
    },
  };
}
