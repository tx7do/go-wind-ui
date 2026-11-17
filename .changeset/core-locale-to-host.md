---
"@go-wind/admin-element": patch
---

core 命名空间文案数据搬除：登录/品牌/通知等 core.* 文案跟着视图走，全部由宿主自带（vue-element 宿主的 src/locales/{lang}/core.json 深合并覆盖），包内置数据清空——dist 实证包自身对 core.* 零字面引用，纯死数据。`coreLocaleModules` 导出与键结构保持兼容（每语言空对象），宿主导入不 break；新宿主需自带 core.json。
