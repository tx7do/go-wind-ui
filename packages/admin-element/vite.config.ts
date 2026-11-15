import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiAdminElement",
      formats: ["es"],
      fileName: () => "admin-element.js",
    },
    rollupOptions: {
      // 全部依赖外置：UI 库走 peer，机制走 @go-wind/admin-core
      external: [
        "vue",
        /^vue\//,
        "vue-router",
        "vue-i18n",
        "pinia",
        "pinia-plugin-persistedstate",
        "element-plus",
        /^element-plus\//,
        /^@element-plus\//,
        "vxe-table",
        /^vxe-table\//,
        "@tanstack/vue-query",
        "@go-wind/admin-core",
      ],
      output: { exports: "named" },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
