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

import { afterEach, describe, expect, it, vi } from "vitest";
import { customFetch } from "./custom-fetch.ts";

interface FakeResponseInit {
  status?: number;
  contentType?: string;
  body?: string;
}

function fakeResponse({
  status = 200,
  contentType = "application/json",
  body = "",
}: FakeResponseInit) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? contentType : null),
    },
    text: vi.fn(async () => body),
  } as unknown as Response;
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("customFetch", () => {
  it("parses a JSON body and keeps the status and headers", async () => {
    const response = fakeResponse({ body: JSON.stringify({ pageViews: 12 }) });
    stubFetch(response);

    const result = await customFetch<{ data: { pageViews: number }; status: number }>(
      "/v1/stats/summary",
    );

    expect(result.data).toEqual({ pageViews: 12 });
    expect(result.status).toBe(200);
    expect(result).toHaveProperty("headers", response.headers);
  });

  it("returns plain text verbatim", async () => {
    stubFetch(fakeResponse({ contentType: "text/plain", body: "pong" }));

    const result = await customFetch<{ data: string }>("/health");

    expect(result.data).toBe("pong");
  });

  it("does not try to read a body for 204 responses", async () => {
    const response = fakeResponse({ status: 204, body: "should not be read" });
    stubFetch(response);

    const result = await customFetch<{ data: unknown }>("/v1/events");

    expect(result.data).toEqual({});
    expect(response.text).not.toHaveBeenCalled();
  });

  it("returns an empty object for an empty body", async () => {
    stubFetch(fakeResponse({ body: "" }));

    const result = await customFetch<{ data: unknown }>("/v1/properties");

    expect(result.data).toEqual({});
  });

  it("always sends cookies with the request", async () => {
    const fetchMock = stubFetch(fakeResponse({ body: "{}" }));

    await customFetch("/v1/stats/summary");

    expect(fetchMock).toHaveBeenCalledWith("/v1/stats/summary", { credentials: "include" });
  });

  it("passes method, headers and body through", async () => {
    const fetchMock = stubFetch(fakeResponse({ body: "{}" }));

    await customFetch("/v1/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "signup" }),
    });

    expect(fetchMock).toHaveBeenCalledWith("/v1/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "signup" }),
      credentials: "include",
    });
  });

  it("throws the status and problem details for failed responses", async () => {
    stubFetch(
      fakeResponse({
        status: 401,
        body: JSON.stringify({ title: "Unauthorized", detail: "Sign in first" }),
      }),
    );

    await expect(customFetch("/v1/stats/summary")).rejects.toEqual({
      status: 401,
      data: { title: "Unauthorized", detail: "Sign in first" },
    });
  });

  it("throws plain text error bodies as data", async () => {
    stubFetch(fakeResponse({ status: 502, contentType: "text/html", body: "Bad Gateway" }));

    await expect(customFetch("/v1/stats/summary")).rejects.toEqual({
      status: 502,
      data: "Bad Gateway",
    });
  });
});
