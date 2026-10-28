import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiChatVue",
      formats: ["es"],
      fileName: () => "chat-vue.js",
    },
    rollupOptions: {
      external: ["vue", "@go-wind-ui/locale", "marked", "dompurify"],
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
