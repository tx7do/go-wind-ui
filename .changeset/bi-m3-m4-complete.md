---
"@go-wind-ui/bi-core": minor
"@go-wind-ui/bi-vue": minor
"@go-wind-ui/bi-react": minor
"@go-wind-ui/bi-engine-s2": minor
"@go-wind-ui/bi-engine-g6": minor
---

BI designer M3/M4 completion — everything planned in docs/bi-designer.md now shipped:

- **Drill-down**: `chart.drill.path` (ordered dimension hierarchy) — click advances a level carrying parent values as implicit filters; per-card back/reset controls; works in both renderers.
- **Cross-chart linkage**: `dashboard.linkage.enabled` — clicking a point filters sibling charts consuming the same dataset; click the same value again (or the ◉ badge) to clear; `linkage-change` event exposed.
- **Card tools**: per-chart fullscreen (requestFullscreen) and PNG export (white-backed canvas snapshot) on every dashboard card.
- **AI hooks (bi-core)**: `nlToSchema` — host injects the model call (`ask`), the bridge builds the schema-v2 contract prompt, strips fences, parses and validates through the migrator; `rowsToChartSuggestion` infers a chart from query result rows (pure, no LLM); `suggestionToDashboard` wrapper.
- **Template market MVP**: `BI_TEMPLATES` (sales overview, service monitoring) + designer toolbar menu to apply a template in one click.
- **bi-engine-s2** (new): AntV S2 pivot table — registers chart type "pivot"; cross-tab rows/columns/values from the encoding, classic/classicDark themes, event normalization.
- **bi-engine-g6** (new): AntV G6 relation graph — registers chart type "graph"; edge-list encoding (dimension=source, series=target, measure=weight), force layout, async render queue. Optional installs keep core lean (tree-shakeable by design).
- **CI**: GitHub Actions — typecheck+build matrix (node 20/22) and a Playwright smoke job (scripts/smoke.mjs boots both playgrounds and asserts core UI mounts with zero page errors).

`bi-engine-l7` (geo maps) is the only documented non-goal: it requires map-service credentials to verify.
