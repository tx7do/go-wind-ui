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
        find: "@go-wind-ui/editor-react/style.css",
        replacement: fileURLToPath(
          new URL("../packages/editor-react/src/tiptap-editor.css", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/bi-vue",
        replacement: fileURLToPath(
          new URL("../packages/bi-vue/src/index.ts", import.meta.url)
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
        find: "@go-wind-ui/bi-engine-s2",
        replacement: fileURLToPath(
          new URL("../packages/bi-engine-s2/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/bi-engine-g6",
        replacement: fileURLToPath(
          new URL("../packages/bi-engine-g6/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/bi-core",
        replacement: fileURLToPath(
          new URL("../packages/bi-core/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/chat-react/style.css",
        replacement: fileURLToPath(
          new URL("../packages/chat-react/src/styles.css", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/chat-react",
        replacement: fileURLToPath(
          new URL("../packages/chat-react/src/index.ts", import.meta.url)
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
    exclude: [
      "@go-wind-ui/editor-react",
      "@go-wind-ui/bi-react",
      "@go-wind-ui/bi-vue",
      "@go-wind-ui/bi-core",
      "@go-wind-ui/bi-engine-s2",
      "@go-wind-ui/bi-engine-g6",
      "@go-wind-ui/chat-react",
    ],
  },
  server: {
    port: 15897,
  },
});
