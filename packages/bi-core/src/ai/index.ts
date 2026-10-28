/**
 * AI 钩子（M4）：与 LLM 的桥接面。本包不做任何网络请求——
 * 宿主注入 ask()（自己的模型调用），本模块负责契约提示词、
 * JSON 解析、schema 校验迁移，以及问数结果 → 图表建议的纯推断。
 */

import { genId, migrateSchema, normalizeSchema } from "../schema/types";
import type { BiChartSchema, BiDashboardSchema, BiRow } from "../schema/types";
import { inferFieldType } from "../dataset/transform";
import { getColumns, unique } from "../dataset";

// ============ 问数结果 → 图表建议（纯函数，无 LLM） ============

/**
 * 从查询结果行推断一张图：首个文本列作维度，数值列作度量，
 * 维度基数 ≤6 且单度量 → 饼图，日期维度 → 折线，其余 → 柱图。
 */
export function rowsToChartSuggestion(rows: BiRow[], title?: string): Partial<BiChartSchema> | null {
  if (!rows?.length) return null;
  const cols = getColumns(rows);
  const numeric = cols.filter((c) => inferFieldType(rows, c) === "number");
  const nonNumeric = cols.filter((c) => inferFieldType(rows, c) !== "number");
  if (!numeric.length) return null;
  const dimension = nonNumeric[0];
  const measure = numeric[0];
  const measures = numeric.slice(0, 3);
  const cardinality = dimension ? unique(rows.map((r) => String(r[dimension]))).length : 0;
  const type =
    dimension && inferFieldType(rows, dimension) === "date"
      ? "line"
      : dimension && cardinality > 0 && cardinality <= 6 && numeric.length === 1
        ? "pie"
        : "bar";
  return {
    id: genId("chart"),
    title: title ?? measure,
    type,
    encoding: { dimension, measure, measures: measures.length > 1 ? measures : undefined },
    w: 6,
    h: 4,
  };
}

// ============ NL → schema 桥 ============

export interface NlSchemaBridgeOptions {
  /**
   * 宿主注入的模型调用：给一段提示词，返回模型文本输出。
   * admin 问数页可复用其现有 AI provider。
   */
  ask: (prompt: string) => Promise<string>;
  /** 校验失败时是否抛错（缺省 true；false 则返回 null 由调用方降级） */
  throwOnInvalid?: boolean;
}

const SCHEMA_CONTRACT = `You output ONLY a JSON object (no markdown fences, no prose) describing a BI dashboard.
Schema contract (schemaVersion must be 2):
{
  "schemaVersion": 2,
  "name": string,
  "datasets": [{ "id": string, "name": string, "type": "static", "rows": array-of-flat-objects }],
  "charts": [{
    "id": string, "title": string, "datasetId": string,
    "type": "bar"|"line"|"area"|"pie"|"donut"|"scatter"|"radar"|"gauge",
    "x": 0-9, "y": 0-8, "w": 3-12, "h": 3-6,
    "encoding": { "dimension": string, "measure": string, "measures"?: string[], "series"?: string },
    "aggregation"?: "sum"|"avg"|"count"|"max"|"min",
    "sort"?: { "by": "dimension"|"measure", "order": "asc"|"desc", "topN"?: number },
    "filters"?: [{ "field": string, "op": "eq"|"ne"|"gt"|"gte"|"lt"|"lte"|"contains"|"in", "value": any }]
  }]
}
Rules: 2-6 charts on a 12-column grid; each chart must reference an existing datasetId; rows must be plausible sample data (5-20 rows) matching the user's domain and language.`;

/**
 * 自然语言 → 可校验的仪表盘 schema。
 * ask() 返回非 JSON 文本（包了 markdown 等）时自动剥离围栏再解析；
 * 解析/校验失败：throwOnInvalid=true 抛错（原始输出已 console.error），
 * 否则返回 null。
 */
export async function nlToSchema(
  idea: string,
  options: NlSchemaBridgeOptions
): Promise<BiDashboardSchema | null> {
  const prompt = `${SCHEMA_CONTRACT}\n\nUser requirement: ${idea}`;
  let raw = "";
  try {
    raw = await options.ask(prompt);
  } catch (err) {
    console.error("[bi] nlToSchema: model call failed", err);
    if (options.throwOnInvalid !== false) throw err;
    return null;
  }
  // 剥离 ```json 围栏 / 前后缀散文
  const text = raw.replace(/```(?:json)?/gi, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  try {
    const schema = migrateSchema(JSON.parse(candidate));
    return schema;
  } catch (err) {
    console.error("[bi] nlToSchema: model output is not a valid dashboard schema", err, raw);
    if (options.throwOnInvalid !== false) throw err;
    return null;
  }
}

/** 便捷包装：把单图建议包成一页仪表盘 */
export function suggestionToDashboard(
  suggestion: Partial<BiChartSchema>,
  rows: BiRow[],
  name = "AI Dashboard"
): BiDashboardSchema {
  return normalizeSchema({
    name,
    datasets: [{ id: "ds_ai", name: "AI", type: "static", rows }],
    charts: [
      {
        ...suggestion,
        id: suggestion.id ?? genId("chart"),
        datasetId: suggestion.datasetId ?? "ds_ai",
      } as BiChartSchema,
    ],
  });
}
