# @go-wind/admin-vben

## 0.1.6

### Patch Changes

- [`bafe231`](https://github.com/tx7do/go-wind-ui/commit/bafe23119af2bd36f4518af3cc5cbcfd6bcbeb0c) Thanks [@tx7do](https://github.com/tx7do)! - 与 admin-core 同源修复：base/shared/utils/date.ts 的 formatDate/formatDateTime 此前用 `dayjs.tz(input, tz)` 直接解析字符串，丢弃 ISO 串的 `Z`/`±hh:mm` 偏移，UTC 时间显示整体早 8 小时。现改为先 `dayjs(input)` 按原义解析再 `.tz()` 换算上海挂钟。vben 宿主 vxe 全局 formatter `formatDateTime`（framework/effects/plugins/vxe-table/extends.ts 注册）经 `@vben/utils` 别名落到本文件，全部列表页时间列随之修复。

## 0.1.5

### Patch Changes

- [`2d714ae`](https://github.com/tx7do/go-wind-ui/commit/2d714ae9a999710dfd428973228c6899b8e6a6ab) Thanks [@tx7do](https://github.com/tx7do)! - 暗色中性灰家族接回设计语言规范 §2.3 的近黑蓝系：`--muted` / `--secondary` / `--accent` 四阶 / `--accent-lighter` / `--accent-hover` / `--heavy` / `--border` 只补彩度（hue 240→220、S 0~5%→18~19%），明度一位不动——原值明度本就落在规范的白 α 合成档（α .05~.13 叠 L1 `#111827`），缺的只是蓝调，故版面权重与描边强弱都不变。宿主实测 A/B（同页同视口，1252 元素 / 885,323 加权像素）：零彩度灰带（chroma<0.15）涂装 1196 条 → 0 条，边框 `#36363A`→`#2D3543`、激活页签 `#2E3033`→`#282E39`。

  `--ring` 另修一处既有缺陷：原 `222.2 84% 4.9%` = `#020817`，与 L0/L1 同档明度，暗色下焦点环画不出来；改为 `212deg 100% 45% / 25%`。tailwind 的 ring 映射是 `hsl(var(--ring))`、不带 `<alpha-value>` 模板，故 α 烘进三元组（同 `--input` 写法）；包内 `ring-ring` 用法均无 `/α` 修饰符，不会因此失效。

  其余 12 个内置配色预设各带一套中性色，不在本口径内。宿主无需改代码，`pnpm update @go-wind/admin-vben` 即生效（vite 不 watch `node_modules`，需重启 dev 服务）。

## 0.1.4

### Patch Changes

- Drop the now-unused json-bigint dependency (JsonViewer switched to regex-preprocessed JSON.parse in 0.1.2; the dependency declaration was intentionally left for that patch train and is cleaned up here).

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
