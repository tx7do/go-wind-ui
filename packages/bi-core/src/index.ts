/**
 * @go-wind-ui/bi-core
 *
 * 框架无关的 BI 仪表盘内核：schema、数据集解析、图表引擎注册表（内置 ECharts
 * 适配器）、主题 token、设计器状态机。渲染器（bi-vue / bi-react）与设计器
 * （designer-vue，M3 桥接 react）都构建在本包之上。
 *
 * 设计文档：docs/bi-designer.md
 */

// Schema 与缺省
export * from "./schema/types";
export { flowPlace, layoutCharts } from "./schema/layout";
export type { BiLayoutResult, BiPlacedChart } from "./schema/layout";

// 数据集解析
export {
  getColumns,
  resolveDatasetRows,
  toNumber,
  unique,
} from "./dataset";
export type { BiDatasetData, BiDatasetResolver } from "./dataset";
export type { BiRow } from "./schema/types";

// 主题
export {
  BI_THEME_DARK,
  BI_THEME_LIGHT,
  detectDark,
  resolveTheme,
  watchDark,
} from "./theme";
export type { BiResolvedTheme } from "./theme";
export { BI_PALETTES, BI_PALETTE_KEYS, resolvePalette } from "./theme/palettes";

// 数据变换（过滤/聚合/排序/TopN + 字段类型推断 + 数值格式化）
export {
  applyFilters,
  aggregateRows,
  sortRows,
  transformRows,
  inferFieldType,
  formatNumber,
} from "./dataset/transform";
export type { BiFieldType } from "./dataset/transform";

// 引擎
export {
  createEchartsEngine,
  compileEcharts,
  installEchartsEngine,
} from "./engine/echarts";
export type { BiEChartsOption } from "./engine/echarts";
export { getEngine, hasEngine, registerEngine } from "./engine/types";
export type { BiChartEvent, ChartEngine, ChartHandle } from "./engine/types";

// 图型注册表（引擎适配器包扩展设计器图型）
export {
  registerChartType,
  getChartTypes,
  getEngineForType,
} from "./engine/chart-types";

// AI 钩子（NL→schema 桥 + 问数结果转图表）
export {
  rowsToChartSuggestion,
  nlToSchema,
  suggestionToDashboard,
} from "./ai";
export type { NlSchemaBridgeOptions } from "./ai";

// 模板库
export { BI_TEMPLATES, getTemplate } from "./templates";
export type { BiTemplate } from "./templates";

// 设计器状态机
export { BiDesignerApi, CHART_MIN_SIZE } from "./designer/designer-api";

// 文案包（纯数据）
export { BI_MESSAGES_ZH, BI_MESSAGES_EN } from "./locale/packs";

// 微型 store（渲染器/设计器绑定用）
export { createTinyStore, deepClone } from "./store/create-store";
export type { TinyStore } from "./store/create-store";

import { installEchartsEngine } from "./engine/echarts";

// 包加载即注册内置引擎
installEchartsEngine();
