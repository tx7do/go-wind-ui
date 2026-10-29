---
"@go-wind/bi-react": patch
---

仪表盘卡片视觉样式从 inline style 移入 styles.css（含 `html.dark` 分支）。此前卡片背景/边框/文字色写死在 inline（`var(--bi-card-bg, var(--el-bg-color, #fff))`），inline 优先级压过任何 CSS 暗色分支——auto 主题（schema 不钉 `theme.key`）的仪表盘在宿主切暗色时卡片永远保持浅色，"跟随主题"在 react 端失效（vue 端走 scoped class 无此问题）。
