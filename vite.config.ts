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
