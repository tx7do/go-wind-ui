import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiEditorVue",
      // ESM-only：Monaco 的 ?worker 导入无法进 UMD
      formats: ["es"],
      fileName: () => "editor-vue.js",
    },
    rollupOptions: {
      external: [
        "vue",
        "element-plus",
        "@element-plus/icons-vue",
        "@go-wind-ui/locale",
        /^@tiptap\//,
        "highlight.js",
        "lowlight",
        "marked",
        "md-editor-v3",
        "json-editor-vue",
        "jsoneditor",
        "monaco-editor",
        /^monaco-editor\//,
      ],
      output: { exports: "named" },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
