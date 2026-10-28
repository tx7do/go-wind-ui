import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [react(), vue()],
  resolve: {
    alias: [
      {
        // 开发态直连包源码（热更新），发布产物仍走包的 exports
        find: "@go-wind/editor-react/style.css",
        replacement: fileURLToPath(
          new URL("../packages/editor-react/src/tiptap-editor.css", import.meta.url)
        ),
      },
      {
        find: "@go-wind/bi-vue",
        replacement: fileURLToPath(
          new URL("../packages/bi-vue/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind/bi-react/style.css",
        replacement: fileURLToPath(
          new URL("../packages/bi-react/src/styles.css", import.meta.url)
        ),
      },
      {
        find: "@go-wind/bi-react",
        replacement: fileURLToPath(
          new URL("../packages/bi-react/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind/bi-engine-s2",
        replacement: fileURLToPath(
          new URL("../packages/bi-engine-s2/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind/bi-engine-g6",
        replacement: fileURLToPath(
          new URL("../packages/bi-engine-g6/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind/bi-core",
        replacement: fileURLToPath(
          new URL("../packages/bi-core/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind/locale",
        replacement: fileURLToPath(
          new URL("../packages/locale/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind/chat-react/style.css",
        replacement: fileURLToPath(
          new URL("../packages/chat-react/src/styles.css", import.meta.url)
        ),
      },
      {
        find: "@go-wind/chat-react",
        replacement: fileURLToPath(
          new URL("../packages/chat-react/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind/editor-react",
        replacement: fileURLToPath(
          new URL("../packages/editor-react/src/index.ts", import.meta.url)
        ),
      },
    ],
  },
  optimizeDeps: {
    exclude: [
      "@go-wind/editor-react",
      "@go-wind/bi-react",
      "@go-wind/bi-vue",
      "@go-wind/bi-core",
      "@go-wind/bi-engine-s2",
      "@go-wind/bi-engine-g6",
      "@go-wind/chat-react",
      "@go-wind/locale",
    ],
  },
  server: {
    port: 15897,
  },
});
