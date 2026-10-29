---
"@go-wind/editor-vue": patch
---

Tiptap 富文本工具栏的三个弹窗（插入链接/代码块/视频）里的按钮改为显式 `import { ElButton }`，模板标签统一 PascalCase。此前模板用 `<el-button>` 但没导入，构建产物是 `resolveComponent("el-button")`，依赖宿主全局注册 ElementPlus；采用按需导入（ElementPlusResolver）的宿主会在打开编辑器时报 `Failed to resolve component: el-button`，按钮也无法渲染。
