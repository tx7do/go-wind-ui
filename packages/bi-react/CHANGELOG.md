# @go-wind/bi-react

## 0.3.0

### Minor Changes

- [`b88a107`](https://github.com/tx7do/go-wind-ui/commit/b88a107330f2a9237c8d0f9ccc825375412bf662) Thanks [@tx7do](https://github.com/tx7do)! - 渲染器新增 `fit: "contain"` 大屏视图模式：按容器宽高双向取小值等比缩放并居中，内容整体撑满容器且不滚动（root 高度取 100%，由宿主给足高度）。`width`（只按容器宽缩放、高度随内容）与 `none`（1:1）语义不变；React 端 `useContainerWidth` 同时回报容器高度，签名扩展为 `[ref, width, height]`。

### Patch Changes

- [`4a9d8a7`](https://github.com/tx7do/go-wind-ui/commit/4a9d8a733c85fb14485c3b06df94811678292c8a) Thanks [@tx7do](https://github.com/tx7do)! - 仪表盘卡片视觉样式从 inline style 移入 styles.css（含 `html.dark` 分支）。此前卡片背景/边框/文字色写死在 inline（`var(--bi-card-bg, var(--el-bg-color, #fff))`），inline 优先级压过任何 CSS 暗色分支——auto 主题（schema 不钉 `theme.key`）的仪表盘在宿主切暗色时卡片永远保持浅色，"跟随主题"在 react 端失效（vue 端走 scoped class 无此问题）。

- Updated dependencies [[`b88a107`](https://github.com/tx7do/go-wind-ui/commit/b88a107330f2a9237c8d0f9ccc825375412bf662), [`fd172f0`](https://github.com/tx7do/go-wind-ui/commit/fd172f08ef1a814868961d4f5cf05561a8106a78)]:
  - @go-wind/bi-vue@0.3.0

## 0.2.2

### Patch Changes

- Fix: declaration files (.d.ts) now land at `dist/index.d.ts` matching the package.json `types` field. Previously vue-tsc preserved workspace-relative paths (e.g. `dist/bi-vue/src/index.d.ts`), making types unresolvable for npm consumers. Build tsconfigs now clear `paths` so declaration generation resolves workspace deps via their built d.ts (topological order), and a post-build flatten script normalizes output.

- Updated dependencies []:
  - @go-wind/bi-core@0.2.2
  - @go-wind/bi-vue@0.2.2

## 0.2.0

### Minor Changes

- [`563dfbe`](https://github.com/tx7do/go-wind-ui/commit/563dfbe1109c7838053085eb991d59113d126c13) Thanks [@tx7do](https://github.com/tx7do)! - BI dashboard suite (M0–M2 of docs/bi-designer.md):

  - **@go-wind/bi-core** (new): framework-agnostic kernel — versioned serializable dashboard schema (`schemaVersion: 1` with migrate entry), dataset model (static rows / api declared, resolved via injected resolvers — zero backend coupling), chart engine registry with built-in ECharts adapter (on-demand registration, 8 chart types: bar/line/area/pie/donut/scatter/radar/gauge), light/dark theme tokens compiled into options, grid layout math (`layoutCharts`, shared by renderer and designer canvas), and `BiDesignerApi` — a framework-agnostic designer state machine (select/add/remove/move/resize/compact/undo/redo/import/export) on a tiny snapshot store.
  - **@go-wind/bi-vue** (new): `<BiDashboard>` read-only renderer + `<BiDesigner>` canvas — dataset panel, pointer drag/resize with grid snapping, property panel, undo/redo, schema import/export, preview mode. `provideBiEnv` injects resolvers/theme/locale; dark theme auto-follows `html.dark`.
  - **@go-wind/bi-react** (new): `<BiProvider>` + `<BiDashboard>` renderer with identical schema and identical layout math (designer output renders pixel-identical); cards shipped with a stylesheet so bare antd hosts get dark-mode card chrome without Element Plus vars.
  - Designer-react bridge and AntV/AI hooks are planned M3/M4 (see docs/bi-designer.md).

- [`d12cd4c`](https://github.com/tx7do/go-wind-ui/commit/d12cd4cf3e1c1820d94775e1c2aec4fb67fff9a6) Thanks [@tx7do](https://github.com/tx7do)! - BI designer M3/M4 completion — everything planned in docs/bi-designer.md now shipped:

  - **Drill-down**: `chart.drill.path` (ordered dimension hierarchy) — click advances a level carrying parent values as implicit filters; per-card back/reset controls; works in both renderers.
  - **Cross-chart linkage**: `dashboard.linkage.enabled` — clicking a point filters sibling charts consuming the same dataset; click the same value again (or the ◉ badge) to clear; `linkage-change` event exposed.
  - **Card tools**: per-chart fullscreen (requestFullscreen) and PNG export (white-backed canvas snapshot) on every dashboard card.
  - **AI hooks (bi-core)**: `nlToSchema` — host injects the model call (`ask`), the bridge builds the schema-v2 contract prompt, strips fences, parses and validates through the migrator; `rowsToChartSuggestion` infers a chart from query result rows (pure, no LLM); `suggestionToDashboard` wrapper.
  - **Template market MVP**: `BI_TEMPLATES` (sales overview, service monitoring) + designer toolbar menu to apply a template in one click.
  - **bi-engine-s2** (new): AntV S2 pivot table — registers chart type "pivot"; cross-tab rows/columns/values from the encoding, classic/classicDark themes, event normalization.
  - **bi-engine-g6** (new): AntV G6 relation graph — registers chart type "graph"; edge-list encoding (dimension=source, series=target, measure=weight), force layout, async render queue. Optional installs keep core lean (tree-shakeable by design).
  - **CI**: GitHub Actions — typecheck+build matrix (node 20/22) and a Playwright smoke job (scripts/smoke.mjs boots both playgrounds and asserts core UI mounts with zero page errors).

  `bi-engine-l7` (geo maps) is the only documented non-goal: it requires map-service credentials to verify.

- [`8358302`](https://github.com/tx7do/go-wind-ui/commit/83583029ee97ae8c3fd2648b785dcc8a3e9982c4) Thanks [@tx7do](https://github.com/tx7do)! - Dashboard theme preset library (大屏主题库) + scale-to-fit container:

  - **bi-core**: `BI_DASHBOARD_THEMES` — 5 built-in presets (Tech Blue / Midnight Violet / Aurora Teal / Graphite / Morning Paper), each pinning chart color mode + palette + canvas/card/title chrome colors. `schema.theme.key` selects a preset; absent/auto follows the host light/dark as before. `resolveDashboardTheme` merges preset into the resolved chart theme. **Fix: `normalizeSchema` now passes through page-level config blocks (`linkage`, `theme`) — previously they were silently dropped on every replace/load, which had also broken the designer's linkage toggle.**
  - **bi-vue / bi-react BiDashboard**: preset chrome applied via `--bi-card-*` / `--bi-canvas-bg` variable injection (card styles now consume the variable chain), chart themes pinned to the preset mode/palette; new `view` prop `{ designWidth, fit: "width" | "none" }` renders the dashboard on a fixed design width with proportional scale-to-fit (大屏等比缩放容器).
  - **bi-vue BiDesigner**: toolbar theme-preset select (auto / 5 presets). The canvas injects the preset variables so cards, canvas and in-canvas charts all preview the dashboard theme live while editing.

- [`e886808`](https://github.com/tx7do/go-wind-ui/commit/e886808c122536d7e610b0916f2dfc35f457b024) Thanks [@tx7do](https://github.com/tx7do)! - - **bi-react**: `BiDesignerReact` — the M3 designer bridge. Mounts the Vue `<BiDesigner>` canvas inside a React host via `createApp` (props: `initialSchema` mount-time snapshot / `demo` / `onChange` / `env`), so React apps get the full designer (datasets panel, drag/resize, property panel, undo/redo, import/export) with identical schema and layout math. Requires `vue` peer and `@go-wind/bi-vue`.

  - **bi-vue**: global dark-mode stylesheet overrides (`html.dark .bi-designer*`, EP-dark equivalents with `--bi-*` host variable chain) so the designer and renderer surfaces follow dark mode on bare hosts without Element Plus css-vars (e.g. pure antd apps).
  - playground-react: editor kind-switch no longer leaks into the BI view; BI demo now has a working renderer/designer toggle via the bridge.

- [`969467b`](https://github.com/tx7do/go-wind-ui/commit/969467b92fee7a135dd0ff42c0570ee460a14777) Thanks [@tx7do](https://github.com/tx7do)! - Designer deepening toward mainstream BI (schema v2):

  - **bi-core**: schema v2 — chart-level `aggregation` (dimension group-by + sum/avg/count/max/min), wide-format multi-measure `encoding.measures` (mutually exclusive with long-format `series`), `sort` (by dimension/measure, asc/desc, topN), chart-level `filters` (eq/ne/gt/gte/lt/lte/contains/in), and `style` (stack, legend toggle, data labels, data zoom, named palettes, number format). New `transformRows` pipeline (filter → aggregate → sort/topN) shared by renderer and designer canvas; `resolvePalette` + 5 built-in palettes; `formatNumber`; `inferFieldType` for field pickers. v1 schemas auto-migrate (all new fields optional).
  - **ECharts adapter**: consumes the full v2 style surface — stack, legend/label toggles, dataZoom (inside + slider, newly registered components), palette override, number formatting on y-axis labels / tooltips / pie labels / gauge detail.
  - **designer-api**: `duplicateChart`, `copyChart`/`pasteChart` (in-memory clipboard), collision push-down on move/resize (grid-stack behavior: overlapping siblings cascade below the anchor).
  - **bi-vue designer**: property panel rebuilt as three tabs — Data (chart-type grid, dataset, dimension with inferred type hints, multi-measure checkbox group, aggregation, series, sort + topN, filter list editor), Style (legend/labels/stack/dataZoom switches, palette select, number format), Layout (position/size/duplicate/delete). Toolbar gains duplicate + paste; keyboard shortcuts: Ctrl+Z/Y (undo/redo), Ctrl+C/V/D (copy/paste/duplicate), Delete, Esc.
  - **renderers**: both Vue and React charts run `transformRows` before compile, so aggregation/filter/sort configured in the designer render identically on dashboards.

### Patch Changes

- [`9fd0c18`](https://github.com/tx7do/go-wind-ui/commit/9fd0c1882044ab45867bb3440b565169e544b874) Thanks [@tx7do](https://github.com/tx7do)! - **bi-core**: five new built-in chart types — `funnel` (sorted descending), `treemap`, `sunburst` (two-level via series grouping), `sankey` (edge-list: dimension=source, series=target, measure=weight), `heatmap` (matrix triplets: dimension=x, series=y, measure=value + continuous visualMap). Edge-list/matrix types (`sankey`/`graph`/`heatmap`) are excluded from the aggregation pipeline via `NON_AGG_TYPES` — their rows are consumed as-is. New ECharts registrations: FunnelChart, TreemapChart, SankeyChart, HeatmapChart, SunburstChart, VisualMapComponent.

  **bi-vue / bi-react**: BiChart mount/update failures now surface on console instead of leaving a silently empty card.

  **bi-vue designer**: property-panel field mapping extended for the new types (sankey/heatmap show source/target/value pickers and hide aggregation; funnel/treemap/sunburst keep aggregation + sort).

  **playground**: demos for funnel (conversion), heatmap (time-bucket matrix), sankey (service call flow).

- Updated dependencies [[`563dfbe`](https://github.com/tx7do/go-wind-ui/commit/563dfbe1109c7838053085eb991d59113d126c13), [`d12cd4c`](https://github.com/tx7do/go-wind-ui/commit/d12cd4cf3e1c1820d94775e1c2aec4fb67fff9a6), [`9fd0c18`](https://github.com/tx7do/go-wind-ui/commit/9fd0c1882044ab45867bb3440b565169e544b874), [`8358302`](https://github.com/tx7do/go-wind-ui/commit/83583029ee97ae8c3fd2648b785dcc8a3e9982c4), [`e886808`](https://github.com/tx7do/go-wind-ui/commit/e886808c122536d7e610b0916f2dfc35f457b024), [`969467b`](https://github.com/tx7do/go-wind-ui/commit/969467b92fee7a135dd0ff42c0570ee460a14777), [`ff00c44`](https://github.com/tx7do/go-wind-ui/commit/ff00c44f00bf4a0e28bb9588b51f3d1a144709fa)]:
  - @go-wind/bi-core@0.2.0
  - @go-wind/bi-vue@0.2.0
