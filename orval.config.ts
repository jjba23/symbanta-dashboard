// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

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
