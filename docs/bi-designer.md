# bi-designer 设计文档

> 状态：**定案（2026-10-28）**，M0–M2 已随本文档同批实施；M3/M4 待排期。
> 本文档是 bi 系列包的唯一权威设计记录；改 schema、引擎接口或分期先改这里。

## 0. 一句话定位

`@go-wind-ui/bi-*` 是配置驱动的仪表盘（BI dashboard）组件族：**一个可序列化 JSON schema 描述整块仪表盘**（数据集 + 图表 + 网格布局），渲染器双框架原生（Vue/React），设计器先做 Vue 一等公民，引擎默认 ECharts、按适配器扩展。

与仓库内其他包的关系：视觉对齐 `docs/design-language.md`（admin 侧）与 EP 语义色；i18n 复用 `@go-wind-ui/locale` 工厂；env 注入模式对齐 editor-vue/editor-react 的 `provideEditorEnv`/`EditorProvider`。

## 1. 定案记录（为什么是现在这个形状）

| 决策点 | 定案 | 理由 |
|---|---|---|
| 包拆分 | `bi-core` + `bi-vue` + `bi-react` | 渲染器薄（ECharts 本身框架无关），core 收敛 schema/编译/状态机 |
| 设计器首发框架 | Vue 先行，designer-react M3 做桥接壳 | 双端并行首创 = 双倍成本 + 永久 parity 负担；本仓 Vue 工具链最强（ele+vben） |
| 布局引擎 | **自研 12 列绝对定位网格 + 指针事件把手** | 不引入 GridStack（直改 DOM 与 vdom 冲突）；沿用仓库「自研把手零依赖」先例（ListTable 列宽拖拽） |
| 图表引擎 | ECharts 唯一内置；引擎接口第一天留好 | Apache-2.0 干净；admin 两端已有按需注册表素材；覆盖管理端九成图型 |
| 多引擎扩展 | 适配器注册表 + 按需子包（`bi-engine-g6` 等） | 引擎按 chart 声明非按仪表盘锁死；独立入口保 tree-shaking |
| 数据接入 | 动作注入（resolver），schema 只存可序列化声明 | 零后端耦合，沿用 element-pro 的 action 注入口径 |
| License 铁律 | ECharts Apache-2.0 / AntV 全家 MIT ✅；Highcharts、AG Grid 商业 ❌ 一票否决 | 沿用打印设计器评估的 license 铁律 |

## 2. Schema v2 规范（2026-10-28 深化）

**可序列化是硬约束**：schema 里不允许出现函数；运行时行为（取数、事件）全部经注入的 resolver/回调连接。

```ts
interface BiDashboardSchema {
  schemaVersion: 1;              // 迁移器链 migrate(v1)→v2… 的锚点
  name: string;
  grid?: { columns?: 12; rowHeight?: number /*px, 默认 80*/; gap?: number /*px, 默认 8*/ };
  datasets: BiDatasetSchema[];   // 数据集与图表分离：一份数据可被多图消费
  charts: BiChartSchema[];
}

interface BiDatasetSchema {
  id: string;
  name: string;
  type: "static" | "api";
  /** static：行数据内嵌（设计器演示/小型场景） */
  rows?: Record<string, any>[];
  /** api：声明式提示（可序列化），真实取数经渲染器的 resolvers[id] 注入 */
  api?: { params?: Record<string, unknown> };
}

interface BiChartSchema {
  id: string;
  title?: string;
  datasetId: string;
  engine?: string;               // 默认 "echarts"
  type: "bar" | "line" | "area" | "pie" | "donut" | "scatter" | "radar" | "gauge";
  /** 12 列网格坐标（栅格单位），x/y 缺省自动流式放置 */
  x?: number; y?: number; w?: number; h?: number;   // w 默认 6，h 默认 4
  /** 引擎无关的视觉映射：dimension=类目轴，measure=单度量，measures=宽表多度量（优先级最高），series=长表系列拆分 */
  encoding: { dimension?: string; measure?: string; measures?: string[]; series?: string };
  /** 聚合：dimension 分组后对度量施加 sum/avg/count/max/min（缺省 sum，"none" 关闭） */
  aggregation?: "sum" | "avg" | "count" | "max" | "min" | "none";
  /** 排序 + TopN（排序后截断） */
  sort?: { by: "dimension" | "measure"; order: "asc" | "desc"; topN?: number };
  /** 图表级过滤器（作用于数据集行，支持 eq/ne/gt/gte/lt/lte/contains/in） */
  filters?: Array<{ field: string; op: string; value: any }>;
  /** 样式：堆叠 / 图例 / 数值标签 / 数据缩放 / 色盘（BI_PALETTES 键）/ 数字格式 */
  style?: {
    stack?: boolean; showLegend?: boolean; showLabel?: boolean; dataZoom?: boolean;
    palette?: string;
    format?: { decimals?: number; thousand?: boolean; prefix?: string; suffix?: string };
  };
  /** 引擎原生透传覆盖（如 echarts option 片段），深合并到编译产物 */
  options?: Record<string, any>;
}
```

类型映射速查：`bar/line/area/scatter` 用 `dimension+measure/measures(+series)`；`pie/donut` 用 `dimension+measure`；`radar` 用 `dimension+measure(+series)`；`gauge` 用 `measure`（取首行）。

数据管线（bi-core `transformRows`，渲染器与设计器画布共用）：**过滤 → 聚合 → 排序/TopN → compile**。多度量（宽表）与系列拆分（长表）互斥，measures 优先。schemaVersion=1 的存量 JSON 由迁移器自动升到 2（新字段全可选，无需手工改）。

## 3. 引擎接口（bi-core）

```ts
interface ChartEngine {
  /** 挂载到容器并渲染首帧；主题由编译期注入 option，不在引擎层切主题 */
  mount(el: HTMLElement, option: unknown): ChartHandle;
  compile(chart: BiChartSchema, rows: Row[], theme: BiResolvedTheme): unknown;
  /** 引擎事件 → 归一化 BiChartEvent（跨引擎联动的基石） */
  bindEvents(handle: ChartHandle, cb: (e: BiChartEvent) => void): void;
}
interface ChartHandle { update(option: unknown): void; resize(): void; dispose(): void; }
// { engine?: 'g6' } 但未注册该引擎 → 抛错并指路安装对应适配器包
```

ECharts 适配器在 `bi-core/src/engine/echarts.ts`：按需注册（Bar/Line/Pie/Scatter/Radar/Gauge + Grid/Legend/Title/Tooltip/Transform + Canvas），素材来自 admin ele 端 `plugins/echarts` 的注册表。主题（亮/暗 token + 10 色盘）编译期写入 option，`backgroundColor: transparent` 保证宿主背景透出。

## 4. 双框架策略

- **渲染器双端原生**（bi-vue / bi-react）：每端只做「实例生命周期 + ResizeObserver + 主题跟随 + 数据解析」，各约 300 行。绝对定位网格两端同构。
- **设计器状态机进 core**：`BiDesignerApi`（选区/增删改/移动缩放/撤销重做/导入导出）是纯 TS 类 + 微型订阅 store（`subscribe/getSnapshot`），React 走 `useSyncExternalStore`、Vue 走 subscribe→shallowRef。UI 逻辑不进 core。
- **designer-vue 一等公民**（M2，已实施）；**designer-react M3 桥接壳**（React 容器 createApp 挂 Vue 设计器），原生重写视需求再议。

## 5. 主题与环境注入

- 亮/暗 token 各一份（text/subText/axisLine/splitLine + 色盘），暗色判定缺省自动跟随 `html.dark`（MutationObserver）+ 系统偏好，与 editor 双端同机制；宿主可经 env 注入 `themeMode` 覆盖。
- Vue：`provideBiEnv({ themeMode?, resolvers?, locale?, messages? })`；React：`<BiProvider env={...}>`。
- resolvers：`Record<datasetId, (dataset, params) => Promise<rows>>`——后端约定全在这层，schema 与渲染器不认识任何 HTTP 客户端。

## 6. 分期与实施状态

| 阶段 | 内容 | 状态 |
|---|---|---|
| M0 | schema v1 + 引擎接口 + echarts 适配器 + 主题 token + BiDesignerApi | ✅ 本次 |
| M1 | bi-vue / bi-react 渲染器（网格布局 + 亮暗主题 + chart-click 事件）+ 双端 playground demo | ✅ 本次 |
| M2 | designer-vue MVP：数据集面板 / 图型选择 / 属性面板 / 指针拖拽缩放（栅格吸附）/ 撤销重做 / schema 导入导出 | ✅ 本次 |
| M3 | designer-react 桥接壳（✅）；schema v2 深化（✅ 聚合/多度量/排序 TopN/过滤器/样式面板/图型网格/复制粘贴/快捷键/碰撞推挤）；余项：下钻、跨图联动过滤、全屏、导出图片 | 部分完成 |
| M4 | AntV 适配器按需接入（g6/s2/l7）；AI 钩子（NL→schema、问数结果转图表）；模板/主题市场 | 待排期 |

## 7. 与 go-wind-admin 的集成点（后续）

- 两端现有手搓 ECharts 封装（react `useEcharts.ts` / ele `plugins/echarts`）M1 后可在 admin 侧评估切换到 bi 渲染器，反向消重。
- AI 问数页（`ai/query`）的图表输出可作为「NL→schema」的第一条真实管线（M4）。
- admin 接入时经 env 注入：`resolvers`（走 generated hooks）、`themeMode`（preferences）、`locale`（应用语言）。
