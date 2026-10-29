---
"@go-wind/editor-vue": patch
---

Tiptap 编辑器的工具栏与状态栏样式改为自包含 scoped CSS，去掉模板里的 Tailwind 工具类（`flex flex-wrap gap-1 px-3 py-2`、`absolute bottom-3 right-4`、`w-px h-4 mx-1.5`、`hidden` 等）。库不应对宿主是否安装 Tailwind 有隐性依赖：宿主 Tailwind 只生成本身用到的类时，状态栏会退化成静态定位跑到编辑器顶部、工具栏失去间距、文件选择框会露出来。同时给 `.tiptap-editor-wrapper` 补 `position: relative`，让状态栏的绝对定位锚在编辑器自身而不是宿主的最近定位祖先。
