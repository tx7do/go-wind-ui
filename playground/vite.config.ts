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
        find: "@go-wind-ui/editor-vue",
        replacement: fileURLToPath(
          new URL("../packages/editor-vue/src/index.ts", import.meta.url)
        ),
      },
    ],
  },
  // workspace 源码包不得进依赖预构建：否则 alias 失效、页面吃到陈旧产物
  optimizeDeps: {
    exclude: ["@go-wind-ui/element-pro", "@go-wind-ui/editor-vue", "@go-wind-ui/locale"],
  },
  server: {
    port: 15898,
  },
});
