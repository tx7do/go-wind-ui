import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiBiVue",
      formats: ["es"],
      fileName: () => "bi-vue.js",
    },
    rollupOptions: {
      external: ["vue", "@go-wind-ui/bi-core", "@go-wind-ui/locale", "echarts", /^echarts\//],
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
