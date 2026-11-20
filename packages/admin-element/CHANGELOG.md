# @go-wind/admin-element

## 0.1.2

### Patch Changes

- Updated dependencies [[`bafe231`](https://github.com/tx7do/go-wind-ui/commit/bafe23119af2bd36f4518af3cc5cbcfd6bcbeb0c)]:
  - @go-wind/admin-core@0.1.1

## 0.1.1

### Patch Changes

- [`6d3db7c`](https://github.com/tx7do/go-wind-ui/commit/6d3db7cdeec2eadc0d8f607d2376f64487a47af5) Thanks [@tx7do](https://github.com/tx7do)! - core 命名空间文案数据搬除：登录/品牌/通知等 core._ 文案跟着视图走，全部由宿主自带（vue-element 宿主的 src/locales/{lang}/core.json 深合并覆盖），包内置数据清空——dist 实证包自身对 core._ 零字面引用，纯死数据。`coreLocaleModules` 导出与键结构保持兼容（每语言空对象），宿主导入不 break；新宿主需自带 core.json。

## 0.1.0

### Minor Changes

- Two new packages extracted from go-wind-admin's vue frontends:

  **@go-wind/admin-core** (framework-agnostic TS): axios transport as the single cross-repo truth — RequestClient (callback-injected auth, 401 refresh queue with stale-queue timeout guards), preset interceptors, captcha headers, pagination query (contains-rewrite / id-exemption / operator-suffix / tenant-cleanup rules), SSE client, storage manager, generic utils, and parameterized crypto (`encryptPassword(pw, key)` / `encryptPasswordEnvelope(pw, rsaPub)` — zero `import.meta.env` reads). vue-element's rest/sse is the truth source; vue-vben's vben-local interceptor branches (biz-401 double-detect, login-request exclusion, dual-spelling refresh URL) are dropped per the archived dead-code audit. 26 vitest cases cover pagination rules, the 401 refresh queue (timeout/empty-token-wakeup/re-auth deadlock guard), crypto round-trips, and utils.

  **@go-wind/admin-element** (Vue 3 + Element Plus binding layer): auth orchestration composables (useAuth / use-token-refresh) driven by an injectable `ElementAuthGateway` + `setAppRouter`, Pinia access/user stores with `initStores({ namespace })`, route factory (frontend/backend modes), preference manager with theme CSS-variable engine, i18n engine with host-injected `localesMap` (built-in core namespace, host wins on collision), access control, framework locales. Depends on @go-wind/admin-core.

  Also fixed en route: `mergeWithArrayOverride` in defu 6.x never replaced arrays (callback mutation ignored — now returns updates); duplicate weak `makeUpdateMask` (no id-suffix guard) converged onto the id-appending guard version; `formatLocaleDate` naming; `file-transfer`'s business `downloadFile` renamed `downloadMinioFile` to avoid the barrel clash with the generic downloader.

### Patch Changes

- Updated dependencies []:
  - @go-wind/admin-core@0.1.0
