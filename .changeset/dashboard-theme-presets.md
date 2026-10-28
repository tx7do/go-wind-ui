---
"@go-wind-ui/bi-core": minor
"@go-wind-ui/bi-vue": minor
"@go-wind-ui/bi-react": minor
---

Dashboard theme preset library (大屏主题库) + scale-to-fit container:

- **bi-core**: `BI_DASHBOARD_THEMES` — 5 built-in presets (Tech Blue / Midnight Violet / Aurora Teal / Graphite / Morning Paper), each pinning chart color mode + palette + canvas/card/title chrome colors. `schema.theme.key` selects a preset; absent/auto follows the host light/dark as before. `resolveDashboardTheme` merges preset into the resolved chart theme. **Fix: `normalizeSchema` now passes through page-level config blocks (`linkage`, `theme`) — previously they were silently dropped on every replace/load, which had also broken the designer's linkage toggle.**
- **bi-vue / bi-react BiDashboard**: preset chrome applied via `--bi-card-*` / `--bi-canvas-bg` variable injection (card styles now consume the variable chain), chart themes pinned to the preset mode/palette; new `view` prop `{ designWidth, fit: "width" | "none" }` renders the dashboard on a fixed design width with proportional scale-to-fit (大屏等比缩放容器).
- **bi-vue BiDesigner**: toolbar theme-preset select (auto / 5 presets). The canvas injects the preset variables so cards, canvas and in-canvas charts all preview the dashboard theme live while editing.
