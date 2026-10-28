/**
 * 数据集模型：行解析 + 列推导。
 * api 型数据集的真实取数由渲染器的 resolvers 注入（零后端耦合），
 * 本模块只处理拿到行之后的事。
 */

import type { BiDatasetSchema, BiRow } from "../schema/types";

export type BiDatasetResolver = (
  dataset: BiDatasetSchema,
  params: Record<string, unknown> | undefined
) => Promise<BiRow[]>;

export interface BiDatasetData {
  rows: BiRow[];
  loading: boolean;
  error: string | null;
}

/** 从行集合推导列名（所有行键的并集，保持首次出现顺序） */
export function getColumns(rows: BiRow[] | undefined): string[] {
  if (!rows?.length) return [];
  const cols: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row ?? {})) {
      if (!seen.has(key)) {
        seen.add(key);
        cols.push(key);
      }
    }
  }
  return cols;
}

/** 数值化：非有限数归 0（图表轴不允许 NaN/undefined） */
export function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** 去重保序 */
export function unique<T>(list: T[]): T[] {
  return [...new Set(list)];
}

/**
 * 解析数据集行：
 * - static：直接内嵌行
 * - api：无 resolver 时返回空行 + 提示错误（fail-visible，不静默）
 */
export async function resolveDatasetRows(
  dataset: BiDatasetSchema,
  resolver?: BiDatasetResolver
): Promise<BiDatasetData> {
  if (dataset.type === "static") {
    return { rows: dataset.rows ?? [], loading: false, error: null };
  }
  if (!resolver) {
    return {
      rows: [],
      loading: false,
      error: `[bi] dataset "${dataset.name}" (${dataset.id}) is type "api" but no resolver was provided`,
    };
  }
  try {
    const rows = await resolver(dataset, dataset.api?.params);
    return { rows: Array.isArray(rows) ? rows : [], loading: false, error: null };
  } catch (err) {
    // 原始错误必须留在控制台：用户可见文案不携带原因（不吞错铁律）
    console.error(`[bi] dataset "${dataset.name}" resolver failed`, err);
    return {
      rows: [],
      loading: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
