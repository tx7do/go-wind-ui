/**
 * BiDashboard Schema v1 —— 可序列化是硬约束：
 * schema 内不允许出现函数，运行时行为（取数/事件）经注入的 resolver/回调连接。
 * 改字段先读 docs/bi-designer.md §2，并同步迁移器。
 */

export type BiRow = Record<string, any>;

export type BiChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "scatter"
  | "radar"
  | "gauge"
  /** 引擎适配器注册的扩展图型（如 s2 的 "pivot"、g6 的 "graph"） */
  | (string & {});

export interface BiGridConfig {
  /** 网格列数，当前固定 12 */
  columns: number;
  /** 单行高度（px） */
  rowHeight: number;
  /** 卡片间距（px） */
  gap: number;
}

export interface BiDatasetSchema {
  id: string;
  name: string;
  type: "static" | "api";
  /** static：行数据内嵌 */
  rows?: BiRow[];
  /** api：声明式提示；真实取数经渲染器 resolvers[id] 注入 */
  api?: { params?: Record<string, unknown> };
}

export interface BiChartEncoding {
  /** 类目轴 / 饼名 / 雷达指标名字段 */
  dimension?: string;
  /** 值轴 / 饼值 / 雷达值 / 仪表值字段（单度量） */
  measure?: string;
  /** 宽表多度量：每个字段各成一个系列（与 measure/series 互斥，优先级最高） */
  measures?: string[];
  /** 系列拆分字段（长表格式，可选） */
  series?: string;
}

/** 聚合函数：dimension 分组后对 measure 施加；"none" 不聚合 */
export type BiAggFn = "sum" | "avg" | "count" | "max" | "min" | "none";

export type BiFilterOp =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "in";

export interface BiChartFilter {
  field: string;
  op: BiFilterOp;
  /** eq/ne/比较/contains：标量；in：数组（UI 以逗号分隔输入） */
  value: string | number | (string | number)[];
}

export interface BiChartSort {
  /** 按维度（类目名）或度量（聚合值）排序 */
  by: "dimension" | "measure";
  order: "asc" | "desc";
  /** 取前 N 项（排序后截断；不传 = 全量） */
  topN?: number;
}

export interface BiNumberFormat {
  /** 小数位数（缺省不处理） */
  decimals?: number;
  /** 千分位 */
  thousand?: boolean;
  prefix?: string;
  suffix?: string;
}

export interface BiChartStyle {
  /** 柱状图堆叠 */
  stack?: boolean;
  /** 显式开关图例（缺省：多系列自动显示） */
  showLegend?: boolean;
  /** 系列上的数值标签 */
  showLabel?: boolean;
  /** 数据缩放（区域缩放滑块，柱/线/面/散点） */
  dataZoom?: boolean;
  /** 色盘 key，见 BI_PALETTES */
  palette?: string;
  /** 数值格式化（轴标签/标签/提示） */
  format?: BiNumberFormat;
}

export interface BiChartSchema {
  id: string;
  title?: string;
  datasetId: string;
  /** 图表引擎，默认 "echarts" */
  engine?: string;
  type: BiChartType;
  /** 12 列网格坐标（栅格单位）；x/y 缺省自动流式放置 */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  encoding: BiChartEncoding;
  /** 聚合函数（dimension 分组 + measure 聚合），缺省 "sum"（设 "none" 关闭） */
  aggregation?: BiAggFn;
  /** 排序 + TopN */
  sort?: BiChartSort;
  /** 图表级过滤器（作用于数据集行） */
  filters?: BiChartFilter[];
  /** 样式选项（堆叠/图例/标签/数据缩放/色盘/数字格式） */
  style?: BiChartStyle;
  /**
   * 下钻路径（维度层级，如 ["category","city"]）：点击图表逐层下钻，
   * 父层级值作为隐式过滤器携带；渲染器提供返回上一层的面包屑。
   */
  drill?: { path: string[] };
  /** 引擎原生透传覆盖（深合并到编译产物） */
  options?: Record<string, any>;
}

export interface BiDashboardSchema {
  /** 当前 2；v1 经 migrateSchema 升版 */
  schemaVersion: 2;
  name: string;
  grid?: Partial<BiGridConfig>;
  datasets: BiDatasetSchema[];
  charts: BiChartSchema[];
  /**
   * 跨图联动：开启后，渲染器中点击带维度的图表会以该维度值过滤
   * 其它消费同一数据集的图表；再点同值或 clearLinkage 取消。
   */
  linkage?: { enabled?: boolean };
}

// ============ 常量与缺省 ============

export const BI_SCHEMA_VERSION = 2;

/** v1 → v2 迁移：v2 新增字段全部可选，旧 schema 补默认即兼容 */
function migrateV1toV2(raw: Record<string, any>): Record<string, any> {
  return { ...raw, schemaVersion: 2 };
}

export const DEFAULT_GRID: BiGridConfig = {
  columns: 12,
  rowHeight: 80,
  gap: 8,
};

export const CHART_DEFAULT_SIZE = { w: 6, h: 4 };

export const BI_CHART_TYPES: BiChartType[] = [
  "bar",
  "line",
  "area",
  "pie",
  "donut",
  "scatter",
  "radar",
  "gauge",
];

export function defaultGrid(grid?: Partial<BiGridConfig>): BiGridConfig {
  return { ...DEFAULT_GRID, ...grid };
}

/** 生成短随机 id（设计器内部用；schema 导入时原样保留已有 id） */
export function genId(prefix = "bi"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 补全部分 schema 为完整 schema（渲染器/设计器入口统一走这里） */
export function normalizeSchema(input: Partial<BiDashboardSchema>): BiDashboardSchema {
  return {
    schemaVersion: BI_SCHEMA_VERSION,
    name: input.name ?? "Dashboard",
    grid: defaultGrid(input.grid),
    datasets: input.datasets ?? [],
    charts: (input.charts ?? []).map((c) => ({
      ...c,
      w: c.w ?? CHART_DEFAULT_SIZE.w,
      h: c.h ?? CHART_DEFAULT_SIZE.h,
      encoding: c.encoding ?? {},
    })),
  };
}

/**
 * schema 迁移器链：逐级升版到当前版本。
 * 结构非法直接抛错（fail-fast，不吞）。
 */
export function migrateSchema(input: unknown): BiDashboardSchema {
  if (!input || typeof input !== "object") {
    throw new Error("[bi] invalid dashboard schema: not an object");
  }
  let raw = input as Record<string, any>;
  if (raw.schemaVersion === 1) {
    raw = migrateV1toV2(raw);
  }
  if (raw.schemaVersion !== BI_SCHEMA_VERSION) {
    throw new Error(
      `[bi] unsupported schemaVersion: ${String(raw.schemaVersion)} (expected ${BI_SCHEMA_VERSION})`
    );
  }
  return normalizeSchema(raw as Partial<BiDashboardSchema>);
}
