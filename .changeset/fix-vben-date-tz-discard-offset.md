---
'@go-wind/admin-vben': patch
---

与 admin-core 同源修复：base/shared/utils/date.ts 的 formatDate/formatDateTime 此前用 `dayjs.tz(input, tz)` 直接解析字符串，丢弃 ISO 串的 `Z`/`±hh:mm` 偏移，UTC 时间显示整体早 8 小时。现改为先 `dayjs(input)` 按原义解析再 `.tz()` 换算上海挂钟。vben 宿主 vxe 全局 formatter `formatDateTime`（framework/effects/plugins/vxe-table/extends.ts 注册）经 `@vben/utils` 别名落到本文件，全部列表页时间列随之修复。
