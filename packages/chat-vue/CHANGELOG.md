# @go-wind/chat-vue

## 0.2.2

### Patch Changes

- Fix: declaration files (.d.ts) now land at `dist/index.d.ts` matching the package.json `types` field. Previously vue-tsc preserved workspace-relative paths (e.g. `dist/bi-vue/src/index.d.ts`), making types unresolvable for npm consumers. Build tsconfigs now clear `paths` so declaration generation resolves workspace deps via their built d.ts (topological order), and a post-build flatten script normalizes output.

- Updated dependencies []:
  - @go-wind/locale@0.2.2

## 0.2.0

### Minor Changes

- [`900022f`](https://github.com/tx7do/go-wind-ui/commit/900022ffa4ba2fc41c3aebc1fbe25ef79555d180) Thanks [@tx7do](https://github.com/tx7do)! - Library expansion round:

  - **element-pro**: `ProDescriptions` — config-driven detail descriptions, the missing sibling of ProForm/ProTable (the "view" third of CRUD). Sections with divider titles (audit-detail-drawer pattern), fields with `cellType` reusing the ProTable cell-renderer registry (tag/date/price/link render identically in lists and details), formatter/slot escape hatches, empty placeholder. Compose inside `ProModal` for the classic detail drawer.
  - **widgets-vue** (new): admin shell widgets, fully presentational with host-injected data — `NoticeDropdown` (bell + unread badge + mark-all-read; SSE/polling is the host's business), `CommandPalette` (Ctrl+K global search: filtering, grouping, keyboard nav, highlight, `usePaletteHotkey`), `ThemeSwitch` (dark toggle emit), `LangSelect`. Built-in zh-CN/en-US widget strings via @go-wind/locale.
  - **chat-vue** (new): AI streaming chat UI — `useChat` state machine (messages, streaming text, abort, error surfacing; transport injected — fetch stream/SSE/WS all work), `ChatMessages` (role bubbles, sanitized markdown via marked+DOMPurify, typing indicator, auto-scroll with stick-to-bottom), `ChatInput` (auto-grow, Enter send / Shift+Enter newline, stop button while streaming).
  - **chat-react** (new): React 19 mirror of the chat suite with identical transport contract.
  - Both playgrounds gain demos: vue "组件套件" view (widgets + ProDescriptions + chat), react "AI 对话" view.

### Patch Changes

- Updated dependencies [[`7be5c28`](https://github.com/tx7do/go-wind-ui/commit/7be5c286bfa4c657de6cf23b6cb9500e52e328f1)]:
  - @go-wind/locale@0.2.0
