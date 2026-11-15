# @go-wind/admin-core

## 0.1.0

### Minor Changes

- Two new packages extracted from go-wind-admin's vue frontends:

  **@go-wind/admin-core** (framework-agnostic TS): axios transport as the single cross-repo truth — RequestClient (callback-injected auth, 401 refresh queue with stale-queue timeout guards), preset interceptors, captcha headers, pagination query (contains-rewrite / id-exemption / operator-suffix / tenant-cleanup rules), SSE client, storage manager, generic utils, and parameterized crypto (`encryptPassword(pw, key)` / `encryptPasswordEnvelope(pw, rsaPub)` — zero `import.meta.env` reads). vue-element's rest/sse is the truth source; vue-vben's vben-local interceptor branches (biz-401 double-detect, login-request exclusion, dual-spelling refresh URL) are dropped per the archived dead-code audit. 26 vitest cases cover pagination rules, the 401 refresh queue (timeout/empty-token-wakeup/re-auth deadlock guard), crypto round-trips, and utils.

  **@go-wind/admin-element** (Vue 3 + Element Plus binding layer): auth orchestration composables (useAuth / use-token-refresh) driven by an injectable `ElementAuthGateway` + `setAppRouter`, Pinia access/user stores with `initStores({ namespace })`, route factory (frontend/backend modes), preference manager with theme CSS-variable engine, i18n engine with host-injected `localesMap` (built-in core namespace, host wins on collision), access control, framework locales. Depends on @go-wind/admin-core.

  Also fixed en route: `mergeWithArrayOverride` in defu 6.x never replaced arrays (callback mutation ignored — now returns updates); duplicate weak `makeUpdateMask` (no id-suffix guard) converged onto the id-appending guard version; `formatLocaleDate` naming; `file-transfer`'s business `downloadFile` renamed `downloadMinioFile` to avoid the barrel clash with the generic downloader.
