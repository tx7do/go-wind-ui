import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        // 开发态直连包源码（热更新），发布产物仍走包的 exports
        find: "@go-wind-ui/editor-react/style.css",
        replacement: fileURLToPath(
          new URL("../packages/editor-react/src/tiptap-editor.css", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/bi-react/style.css",
        replacement: fileURLToPath(
          new URL("../packages/bi-react/src/styles.css", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/bi-react",
        replacement: fileURLToPath(
          new URL("../packages/bi-react/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/bi-core",
        replacement: fileURLToPath(
          new URL("../packages/bi-core/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/editor-react",
        replacement: fileURLToPath(
          new URL("../packages/editor-react/src/index.ts", import.meta.url)
        ),
      },
    ],
  },
  optimizeDeps: {
    exclude: ["@go-wind-ui/editor-react", "@go-wind-ui/bi-react", "@go-wind-ui/bi-core"],
  },
  server: {
    port: 15897,
  },
});
