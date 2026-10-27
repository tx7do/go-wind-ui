import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiElementPro",
      formats: ["es", "umd"],
      fileName: (format) => `element-pro.${format === "es" ? "js" : "umd.cjs"}`,
    },
    rollupOptions: {
      // 运行时依赖全部外置：peer（vue/EP/vxe）+ dependencies 由宿主或包管理器提供
      external: [
        "@go-wind-ui/locale",
        "vue",
        "element-plus",
        "vxe-table",
        "@element-plus/icons-vue",
        "@iconify/vue",
        "@vueuse/core",
        "defu",
        "exceljs",
        "sortablejs",
      ],
      output: {
        globals: {
          vue: "Vue",
          "@go-wind-ui/locale": "GoWindUiLocale",
          "element-plus": "ElementPlus",
          "vxe-table": "VxeTable",
          "@element-plus/icons-vue": "ElementPlusIconsVue",
          "@iconify/vue": "Iconify",
          "@vueuse/core": "VueUse",
          defu: "defu",
          exceljs: "ExcelJS",
          sortablejs: "Sortable",
        },
        exports: "named",
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
