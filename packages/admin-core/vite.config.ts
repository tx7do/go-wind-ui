import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "GoWindUiAdminCore",
      formats: ["es"],
      fileName: () => "admin-core.js",
    },
    rollupOptions: {
      // 纯 TS 机制包：全部依赖外置，由宿主提供
      external: [
        "axios",
        "@microsoft/fetch-event-source",
        "crypto-js",
        "dayjs",
        "defu",
        "clsx",
        "tailwind-merge",
        "nprogress",
        "lodash.clonedeep",
      ],
      output: { exports: "named" },
    },
    sourcemap: true,
  },
});
