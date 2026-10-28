import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiBiEngineS2",
      formats: ["es"],
      fileName: () => "bi-engine-s2.js",
    },
    rollupOptions: {
      external: ["@antv/s2", "@go-wind-ui/bi-core", /^echarts/, "echarts"],
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
