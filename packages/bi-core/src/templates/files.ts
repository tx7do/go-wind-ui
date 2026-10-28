/**
 * 模板文件化：.json 文件级分享（导出/导入）。
 * 服务端模板存储（如 iot 的 SCREEN/TEMPLATE 两 kind CRUD）属于应用职责；
 * 库侧只约定文件格式与校验，应用换壳即用。
 *
 * 文件格式（单 JSON，人可读可手改）：
 * {
 *   "$gwbi": "template",        // 魔术标识，导入时校验
 *   "version": 1,               // 模板文件格式版本
 *   "meta": { "name": ..., "description": ..., "exportedAt": ISO },
 *   "schema": { ...BiDashboardSchema v2 }
 * }
 */

import { migrateSchema } from "../schema/types";
import type { BiDashboardSchema } from "../schema/types";
import type { BiTemplate } from "./index";

const TEMPLATE_MAGIC = "template";
const TEMPLATE_FILE_VERSION = 1;

export interface BiTemplateFile {
  $gwbi: typeof TEMPLATE_MAGIC;
  version: number;
  meta: {
    name: string;
    description?: string;
    exportedAt: string;
  };
  schema: BiDashboardSchema;
}

/** 任意仪表盘 schema → 模板文件对象（可 JSON.stringify 落盘） */
export function toTemplateFile(
  schema: Partial<BiDashboardSchema>,
  meta: { name: string; description?: string }
): BiTemplateFile {
  const normalized = migrateSchema(JSON.parse(JSON.stringify({ ...schema, schemaVersion: schema.schemaVersion ?? 2 })));
  return {
    $gwbi: TEMPLATE_MAGIC,
    version: TEMPLATE_FILE_VERSION,
    meta: { ...meta, exportedAt: new Date().toISOString() },
    schema: normalized,
  };
}

/** 内置模板 → 模板文件对象 */
export function builtinTemplateFile(tpl: BiTemplate): BiTemplateFile {
  return toTemplateFile(tpl.schema, { name: tpl.name, description: tpl.description });
}

/**
 * 解析模板文件（导入入口）：
 * - 魔术标识 / 版本不符 → 抛错（指明原因）
 * - schema 部分走 migrateSchema（v1 自动升版；结构非法抛错）
 * 返回可直接喂设计器/渲染器的 schema。
 */
export function parseTemplateFile(raw: string): BiDashboardSchema {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    throw new Error("[bi] template file is not valid JSON");
  }
  const file = obj as Partial<BiTemplateFile> | null;
  if (!file || typeof file !== "object" || (file as any).$gwbi !== TEMPLATE_MAGIC) {
    throw new Error('[bi] not a go-wind-ui template file (missing "$gwbi": "template")');
  }
  if (file.version !== TEMPLATE_FILE_VERSION) {
    throw new Error(`[bi] unsupported template file version: ${String(file.version)} (expected ${TEMPLATE_FILE_VERSION})`);
  }
  if (!file.schema || typeof file.schema !== "object") {
    throw new Error("[bi] template file has no schema");
  }
  return migrateSchema(file.schema);
}

/** 浏览器下载 .json 模板文件 */
export function exportTemplateFile(
  schema: Partial<BiDashboardSchema>,
  meta: { name: string; description?: string }
): void {
  const file = toTemplateFile(schema, meta);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meta.name || "bi-template"}.gwbi.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 文件选择器读 .json → schema（导入 UI 的 onChange 处理器） */
export function importTemplateFile(file: File): Promise<BiDashboardSchema> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("read file failed"));
    reader.onload = () => {
      try {
        resolve(parseTemplateFile(String(reader.result ?? "")));
      } catch (err) {
        // 原始错误带控制台；reject 的 message 已可读（不吞错）
        console.error("[bi] import template failed", err);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.readAsText(file);
  });
}
