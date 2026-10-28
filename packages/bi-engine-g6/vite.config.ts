import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiBiEngineG6",
      formats: ["es"],
      fileName: () => "bi-engine-g6.js",
    },
    rollupOptions: {
      external: ["@antv/g6", "@go-wind-ui/bi-core", /^echarts/, "echarts"],
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
