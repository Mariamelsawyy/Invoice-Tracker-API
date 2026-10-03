import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DB_NAME: "invoice_test",
    },
    fileParallelism: false,
  },
});