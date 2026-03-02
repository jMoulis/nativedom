import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: [
            "packages/core/tests/signals.test.ts",
            "packages/core/tests/async.test.ts",
            "packages/store/tests/**/*.test.ts",
            "packages/server/tests/**/*.test.ts",
          ],
        },
      },
      {
        test: {
          name: "dom",
          environment: "happy-dom",
          include: [
            "packages/core/tests/html.test.ts",
            "packages/core/tests/component.test.ts",
            "packages/core/tests/context.test.ts",
            "packages/core/tests/ref.test.ts",
            "packages/core/tests/slot.test.ts",
            "packages/core/tests/transition.test.ts",
            "packages/core/tests/watch.test.ts",
            "packages/core/tests/error-boundary.test.ts",
            "packages/core/tests/scoped-css.test.ts",
            "packages/router/tests/**/*.test.ts",
          ],
          setupFiles: ["./scripts/setup-dom.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["packages/*/src/index.ts", "packages/*/src/global.d.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
    reporters: process.env["CI"] === "true" ? ["verbose", "github-actions"] : ["verbose"],
  },
});
