---
'@go-wind/admin-core': patch
---

修复 formatDate/formatDateTime 丢弃时间偏移的缺陷：此前用 `dayjs.tz(input, tz)` 直接解析字符串，tz 插件的字符串分支会把挂钟数字一律当目标时区本地时间重新解释，ISO 串里的 `Z`/`±hh:mm` 偏移被丢弃——后端 protojson 输出的 UTC 时间（`2026-08-06T12:00:00Z`）被显示成上海 12:00（实际应为 20:00），整体早 8 小时。现改为先 `dayjs(input)` 按原义解析（尊重偏移；naive 裸串按浏览器本地），再 `.tz()` 换算上海挂钟展示，绝对时刻不再漂移。展示时区策略不变（统一 Asia/Shanghai）。签名放宽为 `number | string | Date`。
