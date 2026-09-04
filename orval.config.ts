import { defineConfig } from "orval";
export default defineConfig({
  symbanta: {
    input: "https://codeberg.org/jjba23/symbanta/raw/branch/trunk/src/main/resources/openapi.yaml",
    output: {
      target: "./src/api/symbanta.ts",
      schemas: "./src/api/model",
      client: "react-query",
      baseUrl: "http://localhost:8080",
    },
  },
});
