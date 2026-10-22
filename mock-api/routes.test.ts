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

import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { beforeEach, describe, expect, it } from "vitest";
import type {
  AuthResponse,
  V1ConsoleLogsResponse,
  V1EventStatsResponse,
  V1EventType,
  V1PropertiesResponse,
  V1StatsSummaryResponse,
  V1TimeSeriesStatsResponse,
} from "../src/api/model/index.ts";
import { createDataset, hashString, periodWindow, seededRandom } from "./fixtures.ts";
import { createMockRequestHandler } from "./http.ts";
import {
  DEFAULT_DOMAIN,
  createMockApi,
  mockOptionsFromEnv,
  parseRequestUrl,
  type MockApi,
  type MockResponse,
} from "./routes.ts";

const FIXED_NOW = new Date("2026-09-14T09:00:00Z");

function fixedApi(): MockApi {
  return createMockApi({ now: () => FIXED_NOW });
}

function bodyOf<T>(response: MockResponse): T {
  return response.body as T;
}

describe("deterministic fixtures", () => {
  it("hashes strings stably", () => {
    expect(hashString("example.com")).toBe(hashString("example.com"));
    expect(hashString("example.com")).not.toBe(hashString("docs.example.com"));
  });

  it("produces repeatable pseudo-random sequences", () => {
    const first = seededRandom(42);
    const second = seededRandom(42);

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it("maps periods to sensible windows", () => {
    expect(periodWindow("LAST_7_DAYS", FIXED_NOW).buckets).toBe(7);
    expect(periodWindow("LAST_7_DAYS", FIXED_NOW).granularity).toBe("DAY");
    expect(periodWindow("LAST_24_HOURS", FIXED_NOW).buckets).toBe(24);
    expect(periodWindow("LAST_24_HOURS", FIXED_NOW).granularity).toBe("HOUR");
    expect(periodWindow("nonsense", FIXED_NOW).buckets).toBe(7);
  });

  it("builds the same dataset twice", () => {
    const first = createDataset("example.com", "LAST_7_DAYS", { now: FIXED_NOW });
    const second = createDataset("example.com", "LAST_7_DAYS", { now: FIXED_NOW });

    expect(second.summary).toEqual(first.summary);
    expect(second.timeSeries.points).toEqual(first.timeSeries.points);
  });

  it("keeps totals consistent across panels", () => {
    const dataset = createDataset("example.com", "LAST_7_DAYS", { now: FIXED_NOW });
    const totalViews = dataset.timeSeries.points.reduce(
      (total, point) => total + point.pageViews,
      0,
    );

    expect(dataset.summary.pageViews).toBe(totalViews);
    expect(dataset.routes.reduce((total, item) => total + item.pageViews, 0)).toBe(totalViews);
    expect(dataset.countries.reduce((total, item) => total + item.pageViews, 0)).toBe(totalViews);
  });
});

describe("parseRequestUrl", () => {
  it("strips the mount prefix", () => {
    expect(parseRequestUrl("/mock-api/v1/stats/summary").pathname).toBe("/v1/stats/summary");
    expect(parseRequestUrl("/v1/stats/summary").pathname).toBe("/v1/stats/summary");
    expect(parseRequestUrl("/mock-api").pathname).toBe("/");
  });

  it("keeps the query string", () => {
    const { params } = parseRequestUrl("/mock-api/v1/stats/summary?domain=a.com&period=TODAY");

    expect(params.get("domain")).toBe("a.com");
    expect(params.get("period")).toBe("TODAY");
  });
});

describe("mock API routes", () => {
  let api: MockApi;

  beforeEach(() => {
    api = fixedApi();
  });

  it("exposes a health endpoint", () => {
    const response = api.handle("GET", "/health");

    expect(response.status).toBe(200);
    expect(bodyOf<{ status: string }>(response).status).toBe("ok");
  });

  it("answers preflight requests", () => {
    expect(api.handle("OPTIONS", "/v1/stats/summary").status).toBe(204);
  });

  it("authenticates without a backend", () => {
    const me = api.handle("GET", "/auth/me");
    expect(me.status).toBe(200);
    expect(bodyOf<AuthResponse>(me)).toEqual({ username: "demo", role: "admin" });

    const login = api.handle("POST", "/auth/login", { username: "demo", password: "demo" });
    expect(login.status).toBe(200);
    expect(login.headers["set-cookie"]).toContain("symbanta_session=");

    const logout = api.handle("POST", "/auth/logout");
    expect(logout.status).toBe(200);
    expect(logout.headers["set-cookie"]).toContain("Max-Age=0");
  });

  it("lists demo properties", () => {
    const response = api.handle("GET", "/v1/properties");
    const properties = bodyOf<V1PropertiesResponse>(response).properties;

    expect(response.status).toBe(200);
    expect(properties.map((property) => property.domain)).toContain("example.com");
    expect(new Set(properties.map((property) => property.id)).size).toBe(properties.length);
  });

  it("serves the summary for the requested domain and period", () => {
    const response = api.handle("GET", "/v1/stats/summary?domain=example.com&period=LAST_7_DAYS");
    const summary = bodyOf<V1StatsSummaryResponse>(response);

    expect(response.status).toBe(200);
    expect(summary.pageViews).toBeGreaterThan(0);
    expect(summary.visitors).toBeGreaterThan(0);
    expect(summary.from).toBe("2026-09-07T09:00:00.000Z");
    expect(summary.to).toBe("2026-09-14T09:00:00.000Z");
  });

  it("returns the same numbers on repeat requests", () => {
    const url = "/v1/stats/summary?domain=example.com&period=LAST_7_DAYS";

    expect(api.handle("GET", url).body).toEqual(api.handle("GET", url).body);
  });

  it("varies the data per domain", () => {
    const first = bodyOf<V1StatsSummaryResponse>(
      api.handle("GET", "/v1/stats/summary?domain=example.com&period=LAST_7_DAYS"),
    );
    const second = bodyOf<V1StatsSummaryResponse>(
      api.handle("GET", "/v1/stats/summary?domain=docs.example.com&period=LAST_7_DAYS"),
    );

    expect(second.pageViews).not.toBe(first.pageViews);
  });

  it("falls back to a demo domain when none is selected yet", () => {
    const response = api.handle("GET", "/v1/stats/summary");

    expect(response.status).toBe(200);
    expect(bodyOf<V1StatsSummaryResponse>(response).pageViews).toBeGreaterThan(0);
    expect(DEFAULT_DOMAIN).toBe("example.com");
  });

  it("serves hourly buckets for short periods", () => {
    const response = api.handle("GET", "/v1/stats/timeseries?period=LAST_24_HOURS");
    const series = bodyOf<V1TimeSeriesStatsResponse>(response);

    expect(series.granularity).toBe("HOUR");
    expect(series.points).toHaveLength(24);
    expect(series.points.every((point) => !Number.isNaN(Date.parse(point.timestamp)))).toBe(true);
  });

  it("supports custom date ranges", () => {
    const response = api.handle(
      "GET",
      "/v1/stats/timeseries?period=CUSTOM&start-date=2026-09-01&end-date=2026-09-10",
    );
    const series = bodyOf<V1TimeSeriesStatsResponse>(response);

    expect(series.points.length).toBeGreaterThan(1);

    const from = new Date(series.from);
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(8); // September (0-based)
    expect(from.getDate()).toBe(1);
  });

  it.each([
    ["/v1/stats/routes", "route"],
    ["/v1/stats/screen-sizes", "size"],
    ["/v1/stats/user-agents", "userAgent"],
    ["/v1/stats/events", "eventName"],
    ["/v1/stats/countries", "country"],
  ])("serves %s as a sorted breakdown", (path, key) => {
    const response = api.handle("GET", `${path}?domain=example.com&period=LAST_30_DAYS`);
    const payload = bodyOf<{
      from: string;
      to: string;
      items: Array<Record<string, number | string>>;
    }>(response);

    expect(response.status).toBe(200);
    expect(payload.items.length).toBeGreaterThan(0);
    expect(payload.items[0]).toHaveProperty(key);

    const values = payload.items.map((item) => Number(item["pageViews"] ?? item["occurrences"]));
    expect([...values].sort((left, right) => right - left)).toEqual(values);
  });

  it("filters console logs by level and honours the limit", () => {
    const all = bodyOf<V1ConsoleLogsResponse>(api.handle("GET", "/v1/logs?domain=example.com"));
    expect(all.items.length).toBeGreaterThan(5);

    const errors = bodyOf<V1ConsoleLogsResponse>(
      api.handle("GET", "/v1/logs?domain=example.com&level=error"),
    );
    expect(errors.items.every((entry) => entry.level === "error")).toBe(true);

    const limited = bodyOf<V1ConsoleLogsResponse>(
      api.handle("GET", "/v1/logs?domain=example.com&limit=3"),
    );
    expect(limited.items).toHaveLength(3);

    const clamped = bodyOf<V1ConsoleLogsResponse>(
      api.handle("GET", "/v1/logs?domain=example.com&limit=99999"),
    );
    expect(clamped.items.length).toBeLessThanOrEqual(1000);
  });

  it("registers event types idempotently", () => {
    const created = api.handle("POST", "/v1/event-types", {
      domain: "example.com",
      name: "pricing-cta",
      description: "Pressed the pricing CTA",
    });
    const eventType = bodyOf<V1EventType>(created);

    expect(created.status).toBe(201);
    expect(eventType).toMatchObject({
      name: "pricing-cta",
      description: "Pressed the pricing CTA",
    });
    expect(eventType.id).toMatch(/^evt-/);

    const again = api.handle("POST", "/v1/event-types", {
      domain: "example.com",
      name: "pricing-cta",
    });
    expect(again.status).toBe(200);

    const list = bodyOf<{ eventTypes: V1EventType[] }>(
      api.handle("GET", "/v1/event-types?domain=example.com"),
    );
    expect(list.eventTypes.filter((entry) => entry.name === "pricing-cta")).toHaveLength(1);
  });

  it("rejects invalid event type registrations with problem details", () => {
    const invalidName = api.handle("POST", "/v1/event-types", {
      domain: "example.com",
      name: "not valid!",
    });

    expect(invalidName.status).toBe(400);
    expect(bodyOf<{ title: string }>(invalidName).title).toBe("Invalid event name");

    const longDescription = api.handle("POST", "/v1/event-types", {
      domain: "example.com",
      name: "ok-name",
      description: "x".repeat(501),
    });

    expect(longDescription.status).toBe(400);
    expect(longDescription.headers["content-type"]).toContain("application/json");
  });

  it("accepts ingested events", () => {
    const response = api.handle("POST", "/v1/events/register", {
      domain: "example.com",
      eventName: "page-view",
    });

    expect(response.status).toBe(202);
  });

  it("returns 404 problem details for unknown routes", () => {
    const response = api.handle("GET", "/v1/nope");

    expect(response.status).toBe(404);
    expect(bodyOf<{ type: string; title: string }>(response).type).toBe("about:blank");
  });

  it("can simulate failures for error-state work", () => {
    const failing = createMockApi({ now: () => FIXED_NOW, faultStatus: 401 });
    const response = failing.handle("GET", "/v1/stats/summary?domain=example.com");

    expect(response.status).toBe(401);
    expect(bodyOf<{ title: string; detail: string }>(response).detail).toContain("MOCK_API_FAULT");

    // Health stays reachable so you can tell the server is alive.
    expect(failing.handle("GET", "/health").status).toBe(200);
  });

  it("can serve empty datasets for empty-state work", () => {
    const empty = createMockApi({ now: () => FIXED_NOW, empty: true });
    const summary = bodyOf<V1StatsSummaryResponse>(
      empty.handle("GET", "/v1/stats/summary?domain=example.com"),
    );
    const events = bodyOf<V1EventStatsResponse>(
      empty.handle("GET", "/v1/stats/events?domain=example.com"),
    );
    const logs = bodyOf<V1ConsoleLogsResponse>(empty.handle("GET", "/v1/logs?domain=example.com"));

    expect(summary.pageViews).toBe(0);
    expect(summary.visitors).toBe(0);
    expect(events.items).toEqual([]);
    expect(logs.items).toEqual([]);
  });

  it("forgets registered event types on reset", () => {
    api.handle("POST", "/v1/event-types", { domain: "example.com", name: "temp-event" });
    api.reset();

    const list = bodyOf<{ eventTypes: V1EventType[] }>(
      api.handle("GET", "/v1/event-types?domain=example.com"),
    );
    expect(list.eventTypes.map((entry) => entry.name)).not.toContain("temp-event");
  });
});

describe("mockOptionsFromEnv", () => {
  it("reads the switches development uses", () => {
    expect(mockOptionsFromEnv({})).toEqual({});
    expect(
      mockOptionsFromEnv({
        MOCK_API_LATENCY_MS: "250",
        MOCK_API_FAULT: "500",
        MOCK_API_EMPTY: "1",
      }),
    ).toEqual({ latencyMs: 250, faultStatus: 500, empty: true });
  });

  it("ignores values it cannot use", () => {
    expect(mockOptionsFromEnv({ MOCK_API_LATENCY_MS: "soon", MOCK_API_FAULT: "0" })).toEqual({});
  });
});

describe("HTTP handler", () => {
  function fakeRequest(method: string, url: string, body?: string): IncomingMessage {
    const stream = Readable.from(body === undefined ? [] : [Buffer.from(body)]);

    return Object.assign(stream, {
      method,
      url,
      headers: { "content-type": "application/json" },
    }) as unknown as IncomingMessage;
  }

  function fakeResponse() {
    const captured = { status: 0, headers: {} as Record<string, string>, body: "" };
    const response = {
      writeHead: (status: number, headers: Record<string, string>) => {
        captured.status = status;
        captured.headers = headers;
      },
      end: (chunk?: string) => {
        captured.body = chunk ?? "";
      },
      on: () => response,
    };

    return { response: response as unknown as ServerResponse, captured };
  }

  it("serialises the router result as JSON", async () => {
    const handler = createMockRequestHandler(fixedApi(), { cors: true });
    const { response, captured } = fakeResponse();

    handler(fakeRequest("GET", "/mock-api/v1/stats/summary?domain=example.com"), response);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(captured.status).toBe(200);
    expect(captured.headers["content-type"]).toContain("application/json");
    expect(captured.headers["access-control-allow-credentials"]).toBe("true");
    expect(JSON.parse(captured.body)).toHaveProperty("pageViews");
  });

  it("reads JSON request bodies", async () => {
    const handler = createMockRequestHandler(fixedApi());
    const { response, captured } = fakeResponse();

    handler(
      fakeRequest(
        "POST",
        "/v1/event-types",
        JSON.stringify({ domain: "example.com", name: "signup-click" }),
      ),
      response,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(captured.status).toBe(200);
    expect(JSON.parse(captured.body)).toMatchObject({ name: "signup-click" });
  });
});
