# @go-wind/bi-engine-s2

## 1.0.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [[`563dfbe`](https://github.com/tx7do/go-wind-ui/commit/563dfbe1109c7838053085eb991d59113d126c13), [`d12cd4c`](https://github.com/tx7do/go-wind-ui/commit/d12cd4cf3e1c1820d94775e1c2aec4fb67fff9a6), [`9fd0c18`](https://github.com/tx7do/go-wind-ui/commit/9fd0c1882044ab45867bb3440b565169e544b874), [`8358302`](https://github.com/tx7do/go-wind-ui/commit/83583029ee97ae8c3fd2648b785dcc8a3e9982c4), [`969467b`](https://github.com/tx7do/go-wind-ui/commit/969467b92fee7a135dd0ff42c0570ee460a14777), [`ff00c44`](https://github.com/tx7do/go-wind-ui/commit/ff00c44f00bf4a0e28bb9588b51f3d1a144709fa)]:
  - @go-wind/bi-core@0.2.0
