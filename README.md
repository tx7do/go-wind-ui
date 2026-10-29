# go-wind-ui

Framework-generic admin UI building blocks from the [GoWind](https://github.com/tx7do/go-wind-admin) ecosystem — components that only depend on Vue / Element Plus / vxe-table, never on any particular backend convention.

| Package | Description | Status |
|---------|-------------|--------|
| [`@go-wind/element-pro`](./packages/element-pro) | Config-driven CRUD pages for Vue 3 + Element Plus + vxe-table: search bar, toolbar, dual-engine table, pagination, form modal, full-page orchestration | v0.1 |
| [`@go-wind/editor-vue`](./packages/editor-vue) | Vue 3 editor suite: Tiptap rich text, Monaco code, JSON, Markdown, plain text | v0.1 |
| [`@go-wind/editor-react`](./packages/editor-react) | React 19 editor suite: same five editors, antd-based modals | v0.1 |
| [`@go-wind/locale`](./packages/locale) | Tiny reactive i18n store factory shared by the packages above | v0.1 |
| [`@go-wind/bi-core`](./packages/bi-core) | Framework-agnostic BI kernel: serializable dashboard schema, ECharts engine registry, designer state machine | v0.1 |
| [`@go-wind/bi-vue`](./packages/bi-vue) | Vue 3 BI dashboard renderer + designer canvas (drag/resize grid, undo/redo, schema import/export) | v0.1 |
| [`@go-wind/bi-react`](./packages/bi-react) | React 19 BI dashboard renderer + designer bridge (same schema, same layout math) | v0.1 |
| [`@go-wind/bi-engine-s2`](./packages/bi-engine-s2) | AntV S2 pivot-table engine adapter (optional, tree-shakeable) | v0.1 |
| [`@go-wind/bi-engine-g6`](./packages/bi-engine-g6) | AntV G6 relation-graph engine adapter (optional, tree-shakeable) | v0.1 |
| [`@go-wind/widgets-vue`](./packages/widgets-vue) | Admin shell widgets for Vue 3: notification bell, Ctrl+K command palette, theme switch, language select | v0.1 |
| [`@go-wind/chat-vue`](./packages/chat-vue) | AI streaming chat UI for Vue 3 (markdown, typing, stop; transport injected) | v0.1 |
| [`@go-wind/chat-react`](./packages/chat-react) | React 19 mirror of chat-vue | v0.1 |

## Why

`antd` has ProComponents; Element Plus has no authoritative equivalent. This repo distills the Pro component suite battle-tested across 30+ admin pages (and synced to a dozen downstream projects) into a standalone library:

- **One config object = one full CRUD page** (Level 1), with escape hatches down to atomic components (Level 4)
- **Zero backend coupling** — list/delete/submit are injected action functions; pagination param names, request wrapping and response shapes are your adapter's business
- **Dual table engine** — vxe-table (default) or el-table, one API
- **Built-in zh-CN / en-US** locale packs (no vue-i18n dependency), injectable `hasAccess` permission checking, skeleton screen, column settings with drag order, client-side CSV/XLSX export-all, Excel batch import, form drawer close guard
- Full TypeScript types, ESM + UMD builds, tree-shakable

## Host integration notes (Vite)

`@go-wind/editor-*` 的产物里有 Monaco 的 `?worker` 导入，依赖优化器处理不了，宿主必须在
`optimizeDeps.exclude` 里排除它。被排除的子树其传递依赖也不再预构建，其中几个是裸 CJS，
浏览器会报 `does not provide an export named ...`——把下面这些显式纳入预构建即可：

```ts
// vite.config.ts
optimizeDeps: {
  exclude: ['@go-wind/editor-react'], // Vue 宿主换成 '@go-wind/editor-vue'
  include: [
    // @tiptap/react → use-sync-external-store/shim（CJS 具名导出）
    'use-sync-external-store/shim',
    'use-sync-external-store/shim/index.js',
    'use-sync-external-store/shim/with-selector',
    'use-sync-external-store/shim/with-selector.js',
    // lowlight → highlight.js/lib/*（es/*.js 只是转发到 lib/*.js 的 CJS 实现）
    'lowlight',
    'highlight.js',
    'highlight.js/lib/core',
    // 仅 Vue 宿主：json-editor-vue 的 ESM 产物 import json-source-map（纯 CJS）
    'json-editor-vue',
    'json-source-map',
  ],
},
```

`@go-wind/bi-*` 无此类约束，正常消费即可。

## Publish

版本与发布走 changesets（CI 自动化，见 .github/workflows/release.yml）：

```bash
npx changeset                 # 描述变更（patch/minor/major + 包清单）
# push 后 Release 工作流开 Version PR；合入 PR 即自动发布到 npmjs.org
```

前置（一次性）：npmjs.org 创建 org **go-wind**（免费，公开包无费用），
仓库 Settings → Secrets 添加 `NPM_TOKEN`（npmjs → Access Tokens → Automation）。

## Develop

```bash
# node >= 20.19
npx pnpm install
npx pnpm dev          # vue playground at http://localhost:15898
npx pnpm dev:react    # react playground at http://localhost:15897
npx pnpm build        # build all packages
npx pnpm typecheck    # vue-tsc across packages
```

## Roadmap

- [x] `element-pro` — extracted from go-wind-admin's vue-element Pro suite
- [x] `editor-vue` / `editor-react` — Tiptap rich text, Monaco code, JSON, Markdown, plain text (theme-aware, injectable upload)
- [x] `bi-core` / `bi-vue` / `bi-react` — config-driven BI dashboards: designer with aggregation/multi-measure/sort/filters, drill-down, cross-chart linkage, collision layout, undo/redo, schema import/export, templates; optional AntV adapters (S2 pivot, G6 graph); AI hooks (NL-to-schema bridge)
- [ ] `bi-engine-l7` — geo maps (blocked: requires map-service credentials to verify)

## License

[MIT](./LICENSE)
