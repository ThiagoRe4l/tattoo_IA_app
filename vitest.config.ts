import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      SESSION_SECRET: "test-secret-nao-usar-em-producao",
    },
  },
});
