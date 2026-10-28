---
"@go-wind-ui/bi-core": minor
"@go-wind-ui/bi-vue": patch
"@go-wind-ui/bi-react": patch
---

**bi-core**: five new built-in chart types — `funnel` (sorted descending), `treemap`, `sunburst` (two-level via series grouping), `sankey` (edge-list: dimension=source, series=target, measure=weight), `heatmap` (matrix triplets: dimension=x, series=y, measure=value + continuous visualMap). Edge-list/matrix types (`sankey`/`graph`/`heatmap`) are excluded from the aggregation pipeline via `NON_AGG_TYPES` — their rows are consumed as-is. New ECharts registrations: FunnelChart, TreemapChart, SankeyChart, HeatmapChart, SunburstChart, VisualMapComponent.

**bi-vue / bi-react**: BiChart mount/update failures now surface on console instead of leaving a silently empty card.

**bi-vue designer**: property-panel field mapping extended for the new types (sankey/heatmap show source/target/value pickers and hide aggregation; funnel/treemap/sunburst keep aggregation + sort).

**playground**: demos for funnel (conversion), heatmap (time-bucket matrix), sankey (service call flow).
