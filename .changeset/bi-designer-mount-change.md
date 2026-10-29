---
"@go-wind/bi-vue": patch
---

BiDesigner 挂载时主动 emit 一次当前 schema 快照。此前 `BiDesignerApi` 只在用户操作时 emit，宿主（三端设计器抽屉）在"打开后未做任何编辑直接保存"的场景下 onChange 永远不触发，会把待保存 schema 判成空而拒绝保存。
