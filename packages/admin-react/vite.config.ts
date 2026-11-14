import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiAdminReact",
      formats: ["es"],
      fileName: () => "admin-react.js",
    },
    rollupOptions: {
      // 所有依赖外置：dependencies/peerDependencies 由宿主提供。
      // 单例关键库（react/antd/react-i18next/@tanstack/react-query/zustand 等）必须与宿主同一实例，
      // 详见 package.json peerDependencies。
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "antd",
        /^antd\//,
        "@ant-design/icons",
        "@ant-design/pro-components",
        "react-router-dom",
        "react-i18next",
        "i18next",
        "@tanstack/react-query",
        "zustand",
        "axios",
        "@microsoft/fetch-event-source",
        "dayjs",
      ],
      output: { exports: "named" },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
