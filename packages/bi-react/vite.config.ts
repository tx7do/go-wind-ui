import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiBiReact",
      formats: ["es"],
      fileName: () => "bi-react.js",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "@go-wind-ui/bi-core", "echarts", /^echarts\//],
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
