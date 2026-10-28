# @go-wind/editor-react

## 0.2.0

### Minor Changes

- [`7be5c28`](https://github.com/tx7do/go-wind-ui/commit/7be5c286bfa4c657de6cf23b6cb9500e52e328f1) Thanks [@tx7do](https://github.com/tx7do)! - New editor suites extracted from go-wind-admin's production editor components:

  - **@go-wind/editor-vue** (new): Vue 3 editors — Tiptap 3 rich text, Monaco code, JSON (json-editor-vue), Markdown (md-editor-v3), plain text. Theme-following (html.dark → vs-dark etc.) and image upload injectable via `provideEditorEnv` (defaults: base64 upload, auto dark detection). Built-in zh-CN/en-US messages, no vue-i18n dependency. ESM-only (Monaco `?worker` imports require a Vite host).
  - **@go-wind/editor-react** (new): React 19 mirror with antd-based modals — same five editors, `value`/`onChange` props, `EditorProvider` for locale/upload injection, `useTranslation()` shim compatible with react-i18next call shapes.
  - **@go-wind/locale** (new): the reactive i18n store factory both editor packages and element-pro are built on — locale packs, dot-path lookup, `{param}` interpolation, deep-merged custom messages.
  - **@go-wind/element-pro** (patch): locale internals now delegate to @go-wind/locale; public API (`$t`, `useI18n`, `i18n`, `setProLocale`, `setProMessages`) unchanged.
