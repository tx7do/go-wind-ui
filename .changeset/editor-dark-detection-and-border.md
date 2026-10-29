---
"@go-wind/editor-react": patch
"@go-wind/editor-vue": patch
---

暗色判定支持宿主显式主题，修掉"应用亮色、编辑器却是暗色"：`isDarkMode()` 的优先级改为 `data-theme="dark|light"` → `html.dark` / `body.dark` → 系统偏好。此前只认 `html.dark`，用 `data-theme` 表达主题的宿主（antd 系）会被判成"没有主题"，退回去跟随 `prefers-color-scheme`，于是系统暗色 + 应用亮色时编辑器被染黑。Vue 端的 `themeTick` 同步把 `data-theme` 纳入监听（保持数值类型）。

editor-react 另修暗色无边框：基类写死 `border: none !important`，暗色块只改 `border-color`、不给 style/width，编辑器贴在 L1 卡片上完全没有可见边界。现在基类为 `1px solid var(--tte-border-primary)` 并补齐亮色档 `--tte-*` 变量（此前只有暗色块定义，亮色下所有 `var(--tte-*)` 都是无效值）。
