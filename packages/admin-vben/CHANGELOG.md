# @go-wind/admin-vben

## 0.1.0

### Minor Changes

- Initial release of the Vben 5 derived admin shell framework, extracted from go-wind-admin's vue-vben frontend via **layered extraction** driven by git-history modification data: the frozen/low-frequency layers (base, core, ui-kit, root-level constants/icons/locales/preferences/stores/types/utils, effects/access+hooks+common-ui) are packaged; the high-churn business hot zones (effects/layouts — 15 commits/5wks, effects/plugins vxe toolbar) stay host-side so business-driven framework edits remain friction-free in this repo.

  SOURCE-FORM package: hosts consume src/ directly through tsconfig paths (Vben's native architecture — the framework was source-fused into the app before extraction). This keeps full .vue component types, lets the host tailwind pipeline compile the atomic classes (add `node_modules/@go-wind/admin-vben/src/**` to content), and avoids d.ts flattening entirely. Subpaths mirror the original `@vben/*` package positions (preferences, stores, locales, ui-kit/shadcn-ui, base/shared/{cache,color,utils,constants,global-state,store}, ...). All internal `@vben/*` aliases resolved to relative paths (machine-verified: zero reverse deps on host-kept modules); peerDependencies byte-aligned with the pinned vben toolchain (vue 3.5.13 / vue-router 5.4.0 / pinia 2.2.2).
