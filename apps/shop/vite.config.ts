import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: { client: "src/client.ts" },
      output: { entryFileNames: "[name].js" },
    },
  },
});
