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
  | "gauge";

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
  /** 值轴 / 饼值 / 雷达值 / 仪表值字段 */
  measure?: string;
  /** 系列拆分字段（可选） */
  series?: string;
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
  /** 引擎原生透传覆盖（深合并到编译产物） */
  options?: Record<string, any>;
}

export interface BiDashboardSchema {
  schemaVersion: 1;
  name: string;
  grid?: Partial<BiGridConfig>;
  datasets: BiDatasetSchema[];
  charts: BiChartSchema[];
}

// ============ 常量与缺省 ============

export const BI_SCHEMA_VERSION = 1;

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
 * schema 迁移器链：未来 v2 落地时在这里逐级升版。
 * 当前只有 v1，原样返回；结构非法直接抛错（fail-fast，不吞）。
 */
export function migrateSchema(input: unknown): BiDashboardSchema {
  if (!input || typeof input !== "object") {
    throw new Error("[bi] invalid dashboard schema: not an object");
  }
  const raw = input as Record<string, any>;
  if (raw.schemaVersion !== BI_SCHEMA_VERSION) {
    throw new Error(
      `[bi] unsupported schemaVersion: ${String(raw.schemaVersion)} (expected ${BI_SCHEMA_VERSION})`
    );
  }
  return normalizeSchema(raw as Partial<BiDashboardSchema>);
}
