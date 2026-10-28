# @go-wind/element-pro

## 0.2.0

### Minor Changes

- [`900022f`](https://github.com/tx7do/go-wind-ui/commit/900022ffa4ba2fc41c3aebc1fbe25ef79555d180) Thanks [@tx7do](https://github.com/tx7do)! - Library expansion round:

  - **element-pro**: `ProDescriptions` — config-driven detail descriptions, the missing sibling of ProForm/ProTable (the "view" third of CRUD). Sections with divider titles (audit-detail-drawer pattern), fields with `cellType` reusing the ProTable cell-renderer registry (tag/date/price/link render identically in lists and details), formatter/slot escape hatches, empty placeholder. Compose inside `ProModal` for the classic detail drawer.
  - **widgets-vue** (new): admin shell widgets, fully presentational with host-injected data — `NoticeDropdown` (bell + unread badge + mark-all-read; SSE/polling is the host's business), `CommandPalette` (Ctrl+K global search: filtering, grouping, keyboard nav, highlight, `usePaletteHotkey`), `ThemeSwitch` (dark toggle emit), `LangSelect`. Built-in zh-CN/en-US widget strings via @go-wind/locale.
  - **chat-vue** (new): AI streaming chat UI — `useChat` state machine (messages, streaming text, abort, error surfacing; transport injected — fetch stream/SSE/WS all work), `ChatMessages` (role bubbles, sanitized markdown via marked+DOMPurify, typing indicator, auto-scroll with stick-to-bottom), `ChatInput` (auto-grow, Enter send / Shift+Enter newline, stop button while streaming).
  - **chat-react** (new): React 19 mirror of the chat suite with identical transport contract.
  - Both playgrounds gain demos: vue "组件套件" view (widgets + ProDescriptions + chat), react "AI 对话" view.

- [`900022f`](https://github.com/tx7do/go-wind-ui/commit/900022ffa4ba2fc41c3aebc1fbe25ef79555d180) Thanks [@tx7do](https://github.com/tx7do)! - `ProDescriptions` — config-driven detail descriptions, the missing "view" third of the CRUD trio (ProForm form / ProTable list / ProDescriptions view). Sections with divider titles implement the audit-detail-drawer pattern; `cellType` fields reuse the ProTable cell-renderer registry so tags/dates/prices render identically in lists and details; formatter and named-slot escape hatches; empty-value placeholder. Drop it inside `ProModal` for the classic detail drawer.

### Patch Changes

- [`7be5c28`](https://github.com/tx7do/go-wind-ui/commit/7be5c286bfa4c657de6cf23b6cb9500e52e328f1) Thanks [@tx7do](https://github.com/tx7do)! - New editor suites extracted from go-wind-admin's production editor components:

  - **@go-wind/editor-vue** (new): Vue 3 editors — Tiptap 3 rich text, Monaco code, JSON (json-editor-vue), Markdown (md-editor-v3), plain text. Theme-following (html.dark → vs-dark etc.) and image upload injectable via `provideEditorEnv` (defaults: base64 upload, auto dark detection). Built-in zh-CN/en-US messages, no vue-i18n dependency. ESM-only (Monaco `?worker` imports require a Vite host).
  - **@go-wind/editor-react** (new): React 19 mirror with antd-based modals — same five editors, `value`/`onChange` props, `EditorProvider` for locale/upload injection, `useTranslation()` shim compatible with react-i18next call shapes.
  - **@go-wind/locale** (new): the reactive i18n store factory both editor packages and element-pro are built on — locale packs, dot-path lookup, `{param}` interpolation, deep-merged custom messages.
  - **@go-wind/element-pro** (patch): locale internals now delegate to @go-wind/locale; public API (`$t`, `useI18n`, `i18n`, `setProLocale`, `setProMessages`) unchanged.

- Updated dependencies [[`7be5c28`](https://github.com/tx7do/go-wind-ui/commit/7be5c286bfa4c657de6cf23b6cb9500e52e328f1)]:
  - @go-wind/locale@0.2.0
