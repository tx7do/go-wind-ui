# go-wind-ui

Framework-generic admin UI building blocks from the [GoWind](https://github.com/tx7do/go-wind-admin) ecosystem — components that only depend on Vue / Element Plus / vxe-table, never on any particular backend convention.

| Package | Description | Status |
|---------|-------------|--------|
| [`@go-wind-ui/element-pro`](./packages/element-pro) | Config-driven CRUD pages for Vue 3 + Element Plus + vxe-table: search bar, toolbar, dual-engine table, pagination, form modal, full-page orchestration | v0.1 |

## Why

`antd` has ProComponents; Element Plus has no authoritative equivalent. This repo distills the Pro component suite battle-tested across 30+ admin pages (and synced to a dozen downstream projects) into a standalone library:

- **One config object = one full CRUD page** (Level 1), with escape hatches down to atomic components (Level 4)
- **Zero backend coupling** — list/delete/submit are injected action functions; pagination param names, request wrapping and response shapes are your adapter's business
- **Dual table engine** — vxe-table (default) or el-table, one API
- **Built-in zh-CN / en-US** locale packs (no vue-i18n dependency), injectable `hasAccess` permission checking, skeleton screen, column settings with drag order, client-side CSV/XLSX export-all, Excel batch import, form drawer close guard
- Full TypeScript types, ESM + UMD builds, tree-shakable

## Develop

```bash
# node >= 20.19
npx pnpm install
npx pnpm dev          # playground demo at http://localhost:15898
npx pnpm build        # build all packages
npx pnpm typecheck    # vue-tsc across packages
```

## Roadmap

- [x] `element-pro` — extracted from go-wind-admin's vue-element Pro suite
- [ ] `editor` — rich-text (Tiptap) / code (Monaco) editor wrappers
- [ ] `bi-designer` — dashboard/chart designer (MIT kernels only)

## License

[MIT](./LICENSE)
