---
"@go-wind-ui/editor-vue": minor
"@go-wind-ui/editor-react": minor
"@go-wind-ui/locale": minor
"@go-wind-ui/element-pro": patch
---

New editor suites extracted from go-wind-admin's production editor components:

- **@go-wind-ui/editor-vue** (new): Vue 3 editors — Tiptap 3 rich text, Monaco code, JSON (json-editor-vue), Markdown (md-editor-v3), plain text. Theme-following (html.dark → vs-dark etc.) and image upload injectable via `provideEditorEnv` (defaults: base64 upload, auto dark detection). Built-in zh-CN/en-US messages, no vue-i18n dependency. ESM-only (Monaco `?worker` imports require a Vite host).
- **@go-wind-ui/editor-react** (new): React 19 mirror with antd-based modals — same five editors, `value`/`onChange` props, `EditorProvider` for locale/upload injection, `useTranslation()` shim compatible with react-i18next call shapes.
- **@go-wind-ui/locale** (new): the reactive i18n store factory both editor packages and element-pro are built on — locale packs, dot-path lookup, `{param}` interpolation, deep-merged custom messages.
- **@go-wind-ui/element-pro** (patch): locale internals now delegate to @go-wind-ui/locale; public API (`$t`, `useI18n`, `i18n`, `setProLocale`, `setProMessages`) unchanged.
