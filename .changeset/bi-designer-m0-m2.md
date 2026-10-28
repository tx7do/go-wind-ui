---
"@go-wind-ui/bi-core": minor
"@go-wind-ui/bi-vue": minor
"@go-wind-ui/bi-react": minor
---

BI dashboard suite (M0–M2 of docs/bi-designer.md):

- **@go-wind-ui/bi-core** (new): framework-agnostic kernel — versioned serializable dashboard schema (`schemaVersion: 1` with migrate entry), dataset model (static rows / api declared, resolved via injected resolvers — zero backend coupling), chart engine registry with built-in ECharts adapter (on-demand registration, 8 chart types: bar/line/area/pie/donut/scatter/radar/gauge), light/dark theme tokens compiled into options, grid layout math (`layoutCharts`, shared by renderer and designer canvas), and `BiDesignerApi` — a framework-agnostic designer state machine (select/add/remove/move/resize/compact/undo/redo/import/export) on a tiny snapshot store.
- **@go-wind-ui/bi-vue** (new): `<BiDashboard>` read-only renderer + `<BiDesigner>` canvas — dataset panel, pointer drag/resize with grid snapping, property panel, undo/redo, schema import/export, preview mode. `provideBiEnv` injects resolvers/theme/locale; dark theme auto-follows `html.dark`.
- **@go-wind-ui/bi-react** (new): `<BiProvider>` + `<BiDashboard>` renderer with identical schema and identical layout math (designer output renders pixel-identical); cards shipped with a stylesheet so bare antd hosts get dark-mode card chrome without Element Plus vars.
- Designer-react bridge and AntV/AI hooks are planned M3/M4 (see docs/bi-designer.md).
