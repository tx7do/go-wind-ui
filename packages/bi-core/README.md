# @go-wind/bi-core

框架无关的 BI 仪表盘内核：可序列化 dashboard schema、数据集解析、图表引擎注册表（内置 ECharts 适配器）、亮/暗主题 token、设计器状态机。渲染器（`bi-vue` / `bi-react`）与设计器（`designer-vue`）构建在本包之上。

**设计文档：`docs/bi-designer.md`**（schema 规范、引擎接口、分期计划都以它为准）。

## Schema v1 速览

```ts
const schema = {
  schemaVersion: 1,
  name: "销售看板",
  datasets: [
    { id: "ds_month", name: "月度销售", type: "static", rows: [{ month: "1月", sales: 120 }] },
    { id: "ds_api", name: "远程数据", type: "api", api: { params: { range: "30d" } } },
  ],
  charts: [
    {
      id: "c1", datasetId: "ds_month", type: "bar",
      x: 0, y: 0, w: 6, h: 4,                  // 12 列网格坐标
      encoding: { dimension: "month", measure: "sales" },
    },
  ],
};
```

硬约束：**schema 内不允许出现函数**（可序列化）。api 型数据集的取数在渲染器经 `resolvers[datasetId]` 注入；图表点击事件经 `bindEvents` 归一化回调。

## 引擎扩展

```ts
import { registerEngine } from "@go-wind/bi-core";

registerEngine("g6", createG6Engine()); // 实现.ChartEngine 三方法即可接入
```

内置 ECharts（Apache-2.0）按需注册；AntV 系（MIT）按需子包规划中；商业引擎（Highcharts/AG Grid）不接入。

## 设计器状态机

```ts
const api = new BiDesignerApi(schema);
api.subscribe(() => render(api.getSnapshot()));   // React: useSyncExternalStore 同形
api.addChart({ type: "pie" }); api.undo(); api.compact();
api.exportSchema(); api.loadSchema(json);
```
