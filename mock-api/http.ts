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
 * The HTTP glue shared by the Vite middleware and the standalone server.
 * Kept deliberately small: read the body, ask the router, write the answer.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { MockApi, MockResponse } from "./routes.ts";

export interface MockRequestHandlerOptions {
  /** Artificial latency in milliseconds (0 = answer immediately). */
  latencyMs?: number;
  /** Send permissive CORS headers (needed when the API is on another port). */
  cors?: boolean;
}

export async function readRequestBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) return undefined;

  const raw = Buffer.concat(chunks).toString("utf8");
  if (raw.trim().length === 0) return undefined;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export function sendMockResponse(
  response: ServerResponse,
  result: MockResponse,
  extraHeaders: Record<string, string> = {},
): void {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    ...extraHeaders,
    ...result.headers,
  };

  response.writeHead(result.status, headers);

  if (result.body === undefined) {
    response.end();
    return;
  }

  response.end(JSON.stringify(result.body));
}

function corsHeaders(request: IncomingMessage): Record<string, string> {
  return {
    "access-control-allow-origin": request.headers.origin ?? "*",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    vary: "origin",
  };
}

/**
 * Build a Node request handler backed by the mock router. Compatible with
 * Connect/Vite middleware and with a plain `node:http` server.
 */
export function createMockRequestHandler(
  api: MockApi,
  options: MockRequestHandlerOptions = {},
): (request: IncomingMessage, response: ServerResponse) => void {
  const latencyMs = options.latencyMs ?? 0;
  const cors = options.cors === true;

  return (request, response) => {
    const headers = cors ? corsHeaders(request) : {};

    if (cors && request.method === "OPTIONS") {
      response.writeHead(204, headers);
      response.end();
      return;
    }

    void readRequestBody(request)
      .then((body) => {
        const result = api.handle(request.method ?? "GET", request.url ?? "/", body);

        const respond = () => sendMockResponse(response, result, headers);

        if (latencyMs > 0) {
          const timer = setTimeout(respond, latencyMs);
          response.on("close", () => clearTimeout(timer));
          return;
        }

        respond();
      })
      .catch((error: unknown) => {
        sendMockResponse(
          response,
          {
            status: 500,
            headers: {},
            body: {
              type: "about:blank",
              title: "Mock API crashed",
              detail: error instanceof Error ? error.message : String(error),
            },
          },
          headers,
        );
      });
  };
}
