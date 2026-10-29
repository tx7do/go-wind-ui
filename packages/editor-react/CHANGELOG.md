# @go-wind/editor-react

## 0.2.4

### Patch Changes

- [`7721ec5`](https://github.com/tx7do/go-wind-ui/commit/7721ec5cd30753415407631d3a738a4a9545dded) Thanks [@tx7do](https://github.com/tx7do)! - 暗色判定支持宿主显式主题，修掉"应用亮色、编辑器却是暗色"：`isDarkMode()` 的优先级改为 `data-theme="dark|light"` → `html.dark` / `body.dark` → 系统偏好。此前只认 `html.dark`，用 `data-theme` 表达主题的宿主（antd 系）会被判成"没有主题"，退回去跟随 `prefers-color-scheme`，于是系统暗色 + 应用亮色时编辑器被染黑。Vue 端的 `themeTick` 同步把 `data-theme` 纳入监听（保持数值类型）。

  editor-react 另修暗色无边框：基类写死 `border: none !important`，暗色块只改 `border-color`、不给 style/width，编辑器贴在 L1 卡片上完全没有可见边界。现在基类为 `1px solid var(--tte-border-primary)` 并补齐亮色档 `--tte-*` 变量（此前只有暗色块定义，亮色下所有 `var(--tte-*)` 都是无效值）。

## 0.2.2

### Patch Changes

- Fix: declaration files (.d.ts) now land at `dist/index.d.ts` matching the package.json `types` field. Previously vue-tsc preserved workspace-relative paths (e.g. `dist/bi-vue/src/index.d.ts`), making types unresolvable for npm consumers. Build tsconfigs now clear `paths` so declaration generation resolves workspace deps via their built d.ts (topological order), and a post-build flatten script normalizes output.

## 0.2.0

### Minor Changes

- [`7be5c28`](https://github.com/tx7do/go-wind-ui/commit/7be5c286bfa4c657de6cf23b6cb9500e52e328f1) Thanks [@tx7do](https://github.com/tx7do)! - New editor suites extracted from go-wind-admin's production editor components:

  - **@go-wind/editor-vue** (new): Vue 3 editors — Tiptap 3 rich text, Monaco code, JSON (json-editor-vue), Markdown (md-editor-v3), plain text. Theme-following (html.dark → vs-dark etc.) and image upload injectable via `provideEditorEnv` (defaults: base64 upload, auto dark detection). Built-in zh-CN/en-US messages, no vue-i18n dependency. ESM-only (Monaco `?worker` imports require a Vite host).
  - **@go-wind/editor-react** (new): React 19 mirror with antd-based modals — same five editors, `value`/`onChange` props, `EditorProvider` for locale/upload injection, `useTranslation()` shim compatible with react-i18next call shapes.
  - **@go-wind/locale** (new): the reactive i18n store factory both editor packages and element-pro are built on — locale packs, dot-path lookup, `{param}` interpolation, deep-merged custom messages.
  - **@go-wind/element-pro** (patch): locale internals now delegate to @go-wind/locale; public API (`$t`, `useI18n`, `i18n`, `setProLocale`, `setProMessages`) unchanged.
