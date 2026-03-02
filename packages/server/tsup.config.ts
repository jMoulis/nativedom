import { defineConfig } from "tsup";

export default defineConfig({
  // Rename renderer.ts → index.js so the export is a standard dist/index.js
  entry: { index: "src/renderer.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["@nativeframe/core"],
});
