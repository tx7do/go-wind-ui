# @go-wind-ui/bi-react

React 19 BI 仪表盘渲染器，构建在 `@go-wind-ui/bi-core` 之上（设计器当前为 Vue 一等公民，React 侧桥接壳规划于 M3）。设计文档：`docs/bi-designer.md`。

## 快速开始

```bash
pnpm add @go-wind-ui/bi-react
```

```tsx
import "@go-wind-ui/bi-react/style.css";
import { BiProvider, BiDashboard } from "@go-wind-ui/bi-react";

<BiProvider
  env={{
    resolvers: {
      ds_api: async (dataset, params) => (await fetchList(params)).items,
    },
    emptyText: "暂无数据",
  }}
>
  <BiDashboard schema={schema} onChartClick={(e) => console.log(e)} />
</BiProvider>
```

## 设计器（React 桥接壳）

设计器画布是 Vue 一等公民；React 侧经 `BiDesignerReact` 桥接使用（内部 createApp 挂载 Vue 版设计器，schema/布局数学/主题同源）：

```tsx
import { BiDesignerReact } from "@go-wind-ui/bi-react";

<BiDesignerReact
  demo // 无 initialSchema 时内置演示 schema
  env={{ resolvers }}
  onChange={(schema) => save(schema)}
/>
```

边界：`initialSchema` 为挂载时快照，运行期变更需换 `key` 重挂。

## 主题

暗色判定缺省自动跟随 `html.dark` + 系统偏好（`useSyncExternalStore` 订阅共享源）；宿主可经 `<BiProvider env={{ themeMode: () => mode }}>` 接入自己的偏好系统。卡片外观走 `--bi-card-*` 变量回退链，`html.dark` 下无宿主变量时自动落 EP 暗色等值。

## 布局数学

schema 栅格坐标 → 像素矩形的换算在 `bi-core` 的 `layoutCharts`，与 Vue 设计器画布同源——设计器里拖出来的布局在渲染器里像素级一致。
