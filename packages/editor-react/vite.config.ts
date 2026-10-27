import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiEditorReact",
      // ESM-only：Monaco 的 ?worker 导入无法进 UMD
      formats: ["es"],
      fileName: () => "editor-react.js",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "antd",
        "@ant-design/icons",
        /^@tiptap\//,
        "highlight.js",
        "lowlight",
        "marked",
        "md-editor-rt",
        "monaco-editor",
        /^monaco-editor\//,
      ],
      output: { exports: "named" },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
