# @go-wind/admin-react

## 0.3.1

### Patch Changes

- [`3ede6ce`](https://github.com/tx7do/go-wind-ui/commit/3ede6ce697c31dc871f7071dcf82ebd9b76c7dd8) Thanks [@tx7do](https://github.com/tx7do)! - 存储键命名空间隔离：persist 键（app-preferences / user-storage / auth-storage）改为经 `persistKey()` 生成——宿主在 index.html 内联脚本（模块脚本执行前）注入 `document.documentElement.dataset.gowindStorageNs` 即为键加 `<ns>:` 前缀，隔离同一 origin:port 上不同应用的存储污染；未注入时保持裸键（存量部署兼容），新键缺值时对旧裸键做一次性迁移并删除。导出 `persistKey` / `getStorageNamespace` 供宿主自己的 store 复用（如 app-tabs / lock-storage）。登出/强制登出的 localStorage 清理同步改用命名空间键。

## 0.3.0

### Minor Changes

- Add the list export trio extracted from go-wind-admin: **TableExportButton** (CSV/XLSX dropdown, client-side paginated aggregation capped at maxRows, optional server-side full export anchor), the underlying **exportTableData** engine (`exportAuditLogs` moved verbatim, RFC 4180 CSV + ExcelJS XLSX + download helpers), and **serverExportFile** (Bearer-authenticated `:export` anchor fetch — its `import.meta.env.VITE_API_URL` read is replaced by the new `configureAdminRuntime({ apiBaseUrl })` runtime injection). ExcelJS added as a dependency. Six new tests cover multi-page aggregation (BOM/RFC 4180 quoting/ProTable param stripping/maxRows truncation) and the server anchor (URL build, Bearer header, non-2xx error).

## 0.2.0

### Minor Changes

- Add config-driven list base component and generic hooks extracted from go-wind-admin: **ListTable** (ProTable wrapper with column-resize / skeleton / scroll-fill, ships its own css), generic hooks (**useClipboard**, **useKeyStroke**, **usePageFullscreen**, **useEcharts**, **useWatermark**), and the **TABLE** defaults constant. Also adds a Vitest suite (jsdom) covering PaginationQuery query rules, auth store flows via mock AuthGateway, i18n init with merged resources, utils, and a ListTable render smoke test — wired into CI.

## 0.1.0

### Minor Changes

- [`c41c52a`](https://github.com/tx7do/go-wind-ui/commit/c41c52ae9bebf4b47439689dd51b6642d4e44db7) Thanks [@tx7do](https://github.com/tx7do)! - Initial release: React 19 admin shell mechanisms extracted from go-wind-admin — axios transport (token rotation / captcha headers / pagination utils), SSE client, auth store with injectable AuthGateway, route factory (frontend/backend access modes), access control, i18n engine (host-injected resources + built-in framework namespaces), theme/preferences, query client, generic hooks & utils.
