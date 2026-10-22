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
 * Standalone mock API.
 *
 *   npm run mock:api            # http://127.0.0.1:8787
 *   VITE_API_BASE_URL=http://127.0.0.1:8787 npm run dev
 *
 * The dev server already mounts the same router at `/mock-api`, so this entry
 * point is mainly for running the API next to a production build (`npm run
 * preview`) or for exercising the client from another origin — hence the CORS
 * headers and the cookie-friendly defaults.
 *
 * Runs on Node's native TypeScript support (no build step, no dependencies).
 */

import { createServer } from "node:http";
import { createMockRequestHandler } from "./http.ts";
import { createMockApi, mockOptionsFromEnv } from "./routes.ts";

const options = mockOptionsFromEnv(process.env);
const port = Number(process.env.MOCK_API_PORT ?? 8787);
const host = process.env.MOCK_API_HOST ?? "127.0.0.1";

const api = createMockApi(options);
const handler = createMockRequestHandler(api, { latencyMs: options.latencyMs ?? 0, cors: true });

const server = createServer(handler);

server.listen(port, host, () => {
  const flags = [
    options.latencyMs === undefined ? null : `${options.latencyMs}ms latency`,
    options.faultStatus === undefined ? null : `fault ${options.faultStatus}`,
    options.empty === true ? "empty datasets" : null,
  ].filter((flag): flag is string => flag !== null);

  console.log(
    `[mock-api] listening on http://${host}:${port}${flags.length ? ` (${flags.join(", ")})` : ""}`,
  );
  console.log("[mock-api] routes:");
  for (const route of [
    "GET  /auth/me",
    "POST /auth/login",
    "POST /auth/logout",
    "GET  /v1/properties",
    "GET  /v1/stats/summary",
    "GET  /v1/stats/timeseries",
    "GET  /v1/stats/routes",
    "GET  /v1/stats/screen-sizes",
    "GET  /v1/stats/user-agents",
    "GET  /v1/stats/events",
    "GET  /v1/stats/countries",
    "GET  /v1/logs",
    "GET  /v1/event-types",
    "POST /v1/event-types",
    "POST /v1/events/register",
    "GET  /health",
  ]) {
    console.log(`  ${route}`);
  }
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
