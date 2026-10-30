// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { gettextPlugin } from "./i18n/vite-plugin.ts";
import { defineConfig } from "vitest/config";
import { mockApiPlugin } from "./mock-api/plugin.ts";

export default defineConfig({
  plugins: [
    gettextPlugin(),
    react(),
    tailwindcss(),
    /*
     * Local API for development: `/mock-api` serves deterministic demo
     * analytics, so `npm run dev` needs no backend. `.env.development` points
     * the client at it; set `VITE_API_BASE_URL` to use a real API instead.
     */
    mockApiPlugin(),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "mock-api/**/*.test.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "mock-api/**/*.ts"],
      exclude: [
        "src/api/symbanta.ts",
        "src/api/model/**",
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        "mock-api/server.ts",
        "mock-api/**/*.test.ts",
      ],
    },
  },
  // server: {
  //     proxy: {
  //         '/api': {
  //             target: 'http://localhost:8080',
  //             changeOrigin: true,
  //         },
  //         '/v1': {
  //             target: 'http://localhost:8080',
  //             changeOrigin: true,
  //         },
  //     },
  // },
});
