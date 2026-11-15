# @go-wind/admin-vben

## 0.1.3

### Patch Changes

- Locales: replace `import.meta.glob('./langs/**/*.json')` with statically enumerated imports. The source-form package lives inside node_modules where vite's glob transform does not expand — `localesMap` resolved to an empty set and **every framework string rendered as its raw key** on consuming hosts (ui.widgets.search.title etc.). Static imports keep the same path-key → lazy-loader shape `loadLocalesMapFromDir` expects, independent of host pipeline quirks.

## 0.1.2

### Patch Changes

- JsonViewer: drop the json-bigint runtime dependency. json-bigint is raw CJS; when the source-form package is optimizeDeps-excluded (required to keep a single vue instance), its bare imports can't be prebundle-rewritten and the browser crashes on the missing default export. Replaced with a regex-preprocessed JSON.parse that stringifies 15+ digit literals (same storeAsString semantics), and completed the dependency audit — all bare npm imports of the package (lucide-vue-next, class-variance-authority, sortablejs, @ctrl/tinycolor, theme-colors, defu, clsx, tailwind-merge, lodash.\*, json-bigint removed, @vue/shared, nprogress, @vueuse/integrations, watermark-js-plus, vue-json-viewer, @vee-validate/zod) are now declared, with devDeps pinned to the vben host toolchain versions (vue 3.5.13/vue-router 5.4.0/pinia 2.2.2).

## 0.1.1

### Patch Changes

- Pin @tanstack/vue-store to exactly 0.6.0. The published 0.1.0 tarball carried ^0.11.2, but 0.11.x removed the `Store.onUpdate`/`store.batch` APIs that the form-ui/popup-ui/vxe-table adapters are written against (the vben host tree resolves 0.6.0 transitively via @tanstack/vue-query 5.105). Package-internal resolution now matches the API surface the code was written for.

## 0.1.0

### Minor Changes

- Initial release of the Vben 5 derived admin shell framework, extracted from go-wind-admin's vue-vben frontend via **layered extraction** driven by git-history modification data: the frozen/low-frequency layers (base, core, ui-kit, root-level constants/icons/locales/preferences/stores/types/utils, effects/access+hooks+common-ui) are packaged; the high-churn business hot zones (effects/layouts — 15 commits/5wks, effects/plugins vxe toolbar) stay host-side so business-driven framework edits remain friction-free in this repo.

  SOURCE-FORM package: hosts consume src/ directly through tsconfig paths (Vben's native architecture — the framework was source-fused into the app before extraction). This keeps full .vue component types, lets the host tailwind pipeline compile the atomic classes (add `node_modules/@go-wind/admin-vben/src/**` to content), and avoids d.ts flattening entirely. Subpaths mirror the original `@vben/*` package positions (preferences, stores, locales, ui-kit/shadcn-ui, base/shared/{cache,color,utils,constants,global-state,store}, ...). All internal `@vben/*` aliases resolved to relative paths (machine-verified: zero reverse deps on host-kept modules); peerDependencies byte-aligned with the pinned vben toolchain (vue 3.5.13 / vue-router 5.4.0 / pinia 2.2.2).
