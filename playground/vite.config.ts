import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        // 开发态直连包源码（热更新），发布产物仍走包的 exports
        find: "@go-wind-ui/element-pro/style.css",
        replacement: fileURLToPath(
          new URL("../packages/element-pro/src/styles/vxe.scss", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/element-pro",
        replacement: fileURLToPath(
          new URL("../packages/element-pro/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/bi-vue",
        replacement: fileURLToPath(
          new URL("../packages/bi-vue/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/locale",
        replacement: fileURLToPath(
          new URL("../packages/locale/src/index.ts", import.meta.url)
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
        find: "@go-wind-ui/widgets-vue",
        replacement: fileURLToPath(
          new URL("../packages/widgets-vue/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/chat-vue",
        replacement: fileURLToPath(
          new URL("../packages/chat-vue/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/bi-core",
        replacement: fileURLToPath(
          new URL("../packages/bi-core/src/index.ts", import.meta.url)
        ),
      },
      {
        find: "@go-wind-ui/editor-vue",
        replacement: fileURLToPath(
          new URL("../packages/editor-vue/src/index.ts", import.meta.url)
        ),
      },
    ],
  },
  // workspace 源码包不得进依赖预构建：否则 alias 失效、页面吃到陈旧产物
  optimizeDeps: {
    exclude: [
      "@go-wind-ui/element-pro",
      "@go-wind-ui/editor-vue",
      "@go-wind-ui/locale",
      "@go-wind-ui/bi-vue",
      "@go-wind-ui/bi-core",
      "@go-wind-ui/bi-engine-s2",
      "@go-wind-ui/bi-engine-g6",
      "@go-wind-ui/widgets-vue",
      "@go-wind-ui/chat-vue",
    ],
  },
  server: {
    port: 15898,
  },
});
