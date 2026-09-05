import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    env: {
      SESSION_SECRET: "test-secret-nao-usar-em-producao",
    },
  },
});
