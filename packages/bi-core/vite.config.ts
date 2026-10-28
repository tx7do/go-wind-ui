import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiBiCore",
      formats: ["es"],
      fileName: () => "bi-core.js",
    },
    rollupOptions: {
      external: ["echarts", /^echarts\//],
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
