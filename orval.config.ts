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

import { defineConfig } from "orval";

export default defineConfig({
  symbanta: {
    input: "https://codeberg.org/jjba23/symbanta/raw/branch/trunk/src/main/resources/openapi.yaml",
    output: {
      target: "./src/api/symbanta.ts",
      schemas: "./src/api/model",
      client: "react-query",
      override: {
        mutator: {
          path: "./src/api/custom-fetch.ts",
          name: "customFetch",
        },
      },
      //baseUrl: "http://localhost:8080",
      baseUrl: "https://api.symbanta.jointhefreeworld.org",
    },
  },
});
