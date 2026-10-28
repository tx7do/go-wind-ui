---
"@go-wind-ui/bi-react": minor
"@go-wind-ui/bi-vue": patch
---

- **bi-react**: `BiDesignerReact` — the M3 designer bridge. Mounts the Vue `<BiDesigner>` canvas inside a React host via `createApp` (props: `initialSchema` mount-time snapshot / `demo` / `onChange` / `env`), so React apps get the full designer (datasets panel, drag/resize, property panel, undo/redo, import/export) with identical schema and layout math. Requires `vue` peer and `@go-wind-ui/bi-vue`.
- **bi-vue**: global dark-mode stylesheet overrides (`html.dark .bi-designer*`, EP-dark equivalents with `--bi-*` host variable chain) so the designer and renderer surfaces follow dark mode on bare hosts without Element Plus css-vars (e.g. pure antd apps).
- playground-react: editor kind-switch no longer leaks into the BI view; BI demo now has a working renderer/designer toggle via the bridge.
