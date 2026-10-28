import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiChatReact",
      formats: ["es"],
      fileName: () => "chat-react.js",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "marked", "dompurify"],
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
