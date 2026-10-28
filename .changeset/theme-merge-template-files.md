---
"@go-wind-ui/bi-core": minor
"@go-wind-ui/bi-vue": minor
---

Theme library merge (from go-wind-iot screens) + template file format:

- **bi-core themes**: merged the 4 go-wind-iot screen presets (ocean / forest / purple→nebula / dawn) into `BI_DASHBOARD_THEMES` (now 9 presets + auto), preserving the original color values exactly. New `BiStageColors` structured stage palette (bg/panelBg/panelBorder/accent/axis/legend/text/series) carried on presets; `resolveStageColors` provides iot's lenient per-field fallback resolution (unknown key / partial overrides / short series arrays fall back to the preset baseline) for schema-persisted custom themes. New `BI_SEMANTIC_COLORS` constants — alarm red/green/severity colors stay stable across themes (semantic colors never follow the theme).
- **bi-core templates**: template file format for share/import — `toTemplateFile` / `parseTemplateFile` / `exportTemplateFile` (browser download of `.gwbi.json`) / `importTemplateFile` (File → schema). Files carry a `$gwbi: "template"` magic marker + format version; schema payloads go through `migrateSchema` (v1 auto-upgrades). Server-side template CRUD (like iot's SCREEN/TEMPLATE kinds) remains an application concern — the library only owns the file contract.
- **bi-vue designer**: toolbar gains "导出模板" (current canvas → template file); the import button now accepts both bare schema JSON and `.gwbi.json` template files.
