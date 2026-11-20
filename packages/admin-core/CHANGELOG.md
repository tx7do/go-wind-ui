# @go-wind/admin-core

## 0.1.1

### Patch Changes

- [`bafe231`](https://github.com/tx7do/go-wind-ui/commit/bafe23119af2bd36f4518af3cc5cbcfd6bcbeb0c) Thanks [@tx7do](https://github.com/tx7do)! - 修复 formatDate/formatDateTime 丢弃时间偏移的缺陷：此前用 `dayjs.tz(input, tz)` 直接解析字符串，tz 插件的字符串分支会把挂钟数字一律当目标时区本地时间重新解释，ISO 串里的 `Z`/`±hh:mm` 偏移被丢弃——后端 protojson 输出的 UTC 时间（`2026-08-06T12:00:00Z`）被显示成上海 12:00（实际应为 20:00），整体早 8 小时。现改为先 `dayjs(input)` 按原义解析（尊重偏移；naive 裸串按浏览器本地），再 `.tz()` 换算上海挂钟展示，绝对时刻不再漂移。展示时区策略不变（统一 Asia/Shanghai）。签名放宽为 `number | string | Date`。

## 0.1.0

### Minor Changes

- Two new packages extracted from go-wind-admin's vue frontends:

  **@go-wind/admin-core** (framework-agnostic TS): axios transport as the single cross-repo truth — RequestClient (callback-injected auth, 401 refresh queue with stale-queue timeout guards), preset interceptors, captcha headers, pagination query (contains-rewrite / id-exemption / operator-suffix / tenant-cleanup rules), SSE client, storage manager, generic utils, and parameterized crypto (`encryptPassword(pw, key)` / `encryptPasswordEnvelope(pw, rsaPub)` — zero `import.meta.env` reads). vue-element's rest/sse is the truth source; vue-vben's vben-local interceptor branches (biz-401 double-detect, login-request exclusion, dual-spelling refresh URL) are dropped per the archived dead-code audit. 26 vitest cases cover pagination rules, the 401 refresh queue (timeout/empty-token-wakeup/re-auth deadlock guard), crypto round-trips, and utils.

  **@go-wind/admin-element** (Vue 3 + Element Plus binding layer): auth orchestration composables (useAuth / use-token-refresh) driven by an injectable `ElementAuthGateway` + `setAppRouter`, Pinia access/user stores with `initStores({ namespace })`, route factory (frontend/backend modes), preference manager with theme CSS-variable engine, i18n engine with host-injected `localesMap` (built-in core namespace, host wins on collision), access control, framework locales. Depends on @go-wind/admin-core.

  Also fixed en route: `mergeWithArrayOverride` in defu 6.x never replaced arrays (callback mutation ignored — now returns updates); duplicate weak `makeUpdateMask` (no id-suffix guard) converged onto the id-appending guard version; `formatLocaleDate` naming; `file-transfer`'s business `downloadFile` renamed `downloadMinioFile` to avoid the barrel clash with the generic downloader.
