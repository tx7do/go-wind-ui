---
"@go-wind-ui/bi-core": minor
"@go-wind-ui/bi-vue": minor
"@go-wind-ui/bi-react": minor
---

Designer deepening toward mainstream BI (schema v2):

- **bi-core**: schema v2 — chart-level `aggregation` (dimension group-by + sum/avg/count/max/min), wide-format multi-measure `encoding.measures` (mutually exclusive with long-format `series`), `sort` (by dimension/measure, asc/desc, topN), chart-level `filters` (eq/ne/gt/gte/lt/lte/contains/in), and `style` (stack, legend toggle, data labels, data zoom, named palettes, number format). New `transformRows` pipeline (filter → aggregate → sort/topN) shared by renderer and designer canvas; `resolvePalette` + 5 built-in palettes; `formatNumber`; `inferFieldType` for field pickers. v1 schemas auto-migrate (all new fields optional).
- **ECharts adapter**: consumes the full v2 style surface — stack, legend/label toggles, dataZoom (inside + slider, newly registered components), palette override, number formatting on y-axis labels / tooltips / pie labels / gauge detail.
- **designer-api**: `duplicateChart`, `copyChart`/`pasteChart` (in-memory clipboard), collision push-down on move/resize (grid-stack behavior: overlapping siblings cascade below the anchor).
- **bi-vue designer**: property panel rebuilt as three tabs — Data (chart-type grid, dataset, dimension with inferred type hints, multi-measure checkbox group, aggregation, series, sort + topN, filter list editor), Style (legend/labels/stack/dataZoom switches, palette select, number format), Layout (position/size/duplicate/delete). Toolbar gains duplicate + paste; keyboard shortcuts: Ctrl+Z/Y (undo/redo), Ctrl+C/V/D (copy/paste/duplicate), Delete, Esc.
- **renderers**: both Vue and React charts run `transformRows` before compile, so aggregation/filter/sort configured in the designer render identically on dashboards.
