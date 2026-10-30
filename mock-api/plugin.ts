// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import type { Connect, Plugin } from "vite";
import { createMockRequestHandler } from "./http.ts";
import {
  MOCK_BASE_PATH,
  createMockApi,
  mockOptionsFromEnv,
  type MockApiOptions,
} from "./routes.ts";

export interface MockApiPluginOptions extends MockApiOptions {
  /** URL prefix the mock API is served under. */
  base?: string;
  /** Environment to read `MOCK_API_*` switches from. */
  env?: Record<string, string | undefined>;
}

function describe(options: MockApiOptions, base: string): string {
  const parts = [`mounted at ${base}`];

  if (options.latencyMs) parts.push(`${options.latencyMs}ms latency`);
  if (options.faultStatus) parts.push(`failing every request with ${options.faultStatus}`);
  if (options.empty) parts.push("empty datasets");

  return `[mock-api] ${parts.join(", ")}`;
}

/**
 * Serve the mock API from the Vite dev/preview server.
 *
 * Because it runs on the same origin as the app, the session cookie behaves
 * exactly like it does in production; no proxy or CORS configuration needed.
 * Pair it with `VITE_API_BASE_URL=/mock-api` (already the default in
 * `.env.development`).
 */
export function mockApiPlugin(pluginOptions: MockApiPluginOptions = {}): Plugin {
  const envOptions = mockOptionsFromEnv(pluginOptions.env ?? process.env);
  const latencyMs = pluginOptions.latencyMs ?? envOptions.latencyMs ?? 120;

  const options: MockApiOptions = {
    ...envOptions,
    ...(pluginOptions.faultStatus === undefined ? {} : { faultStatus: pluginOptions.faultStatus }),
    ...(pluginOptions.empty === undefined ? {} : { empty: pluginOptions.empty }),
    ...(pluginOptions.now === undefined ? {} : { now: pluginOptions.now }),
    latencyMs,
  };

  const base = pluginOptions.base ?? MOCK_BASE_PATH;
  const handler = createMockRequestHandler(createMockApi(options), { latencyMs });

  const attach = (middlewares: Connect.Server, logger: (message: string) => void) => {
    middlewares.use(base, handler);
    logger(describe(options, base));
  };

  return {
    name: "symbanta:mock-api",
    apply: "serve",
    configureServer(server) {
      attach(server.middlewares, (message) => server.config.logger.info(message));
    },
    configurePreviewServer(server) {
      attach(server.middlewares, (message) => server.config.logger.info(message));
    },
  };
}
