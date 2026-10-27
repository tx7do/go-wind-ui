import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiLocale",
      formats: ["es", "umd"],
      fileName: (format) => `locale.${format === "es" ? "js" : "umd.cjs"}`,
    },
    rollupOptions: {
      external: ["vue"],
      output: { globals: { vue: "Vue" }, exports: "named" },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
