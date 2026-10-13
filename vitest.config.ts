import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    server: { deps: { inline: [/ha-nunjucks/, /ts-py-datetime/] } },
  },
});
