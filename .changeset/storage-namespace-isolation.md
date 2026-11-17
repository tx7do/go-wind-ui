---
"@go-wind/admin-react": patch
---

存储键命名空间隔离：persist 键（app-preferences / user-storage / auth-storage）改为经 `persistKey()` 生成——宿主在 index.html 内联脚本（模块脚本执行前）注入 `document.documentElement.dataset.gowindStorageNs` 即为键加 `<ns>:` 前缀，隔离同一 origin:port 上不同应用的存储污染；未注入时保持裸键（存量部署兼容），新键缺值时对旧裸键做一次性迁移并删除。导出 `persistKey` / `getStorageNamespace` 供宿主自己的 store 复用（如 app-tabs / lock-storage）。登出/强制登出的 localStorage 清理同步改用命名空间键。
