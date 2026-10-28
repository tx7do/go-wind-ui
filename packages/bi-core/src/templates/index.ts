/**
 * 内置仪表盘模板库（M4 模板市场 MVP）：设计器一键套用，
 * 也可经 migrateSchema 校验后作为宿主的起始 schema。
 */

import type { BiDashboardSchema } from "../schema/types";

export interface BiTemplate {
  key: string;
  name: string;
  description: string;
  schema: BiDashboardSchema;
}

function salesTemplate(): BiDashboardSchema {
  const orders = Array.from({ length: 48 }, (_, i) => ({
    city: ["北京", "上海", "广州", "深圳", "杭州", "成都"][i % 6],
    category: ["硬件", "软件", "服务"][i % 3],
    amount: Math.round(50 + Math.random() * 450),
  }));
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1}月`,
    sales: Math.round(80 + Math.sin(i / 2) * 60 + i * 8),
    target: 160,
  }));
  return {
    schemaVersion: 2,
    name: "销售概览",
    datasets: [
      { id: "tpl_orders", name: "订单明细", type: "static", rows: orders },
      { id: "tpl_months", name: "月度汇总", type: "static", rows: months },
    ],
    charts: [
      {
        id: "tpl_s_bar",
        title: "城市订单 Top6",
        datasetId: "tpl_orders",
        type: "bar",
        x: 0, y: 0, w: 6, h: 4,
        encoding: { dimension: "city", measure: "amount" },
        aggregation: "sum",
        sort: { by: "measure", order: "desc", topN: 6 },
      },
      {
        id: "tpl_s_wide",
        title: "销售 vs 目标",
        datasetId: "tpl_months",
        type: "bar",
        x: 6, y: 0, w: 6, h: 4,
        encoding: { dimension: "month", measures: ["sales", "target"] },
        style: { showLegend: true },
      },
      {
        id: "tpl_s_pie",
        title: "品类占比",
        datasetId: "tpl_orders",
        type: "donut",
        x: 0, y: 4, w: 6, h: 4,
        encoding: { dimension: "category", measure: "amount" },
        aggregation: "sum",
      },
      {
        id: "tpl_s_area",
        title: "销售趋势",
        datasetId: "tpl_months",
        type: "area",
        x: 6, y: 4, w: 6, h: 4,
        encoding: { dimension: "month", measure: "sales" },
      },
    ],
  };
}

function opsTemplate(): BiDashboardSchema {
  const services = Array.from({ length: 24 }, (_, i) => ({
    service: ["api-gateway", "auth", "order", "pay", "search", "notify"][i % 6] + `-${Math.floor(i / 6) + 1}`,
    latency: Math.round(20 + Math.random() * 180),
    errors: Math.round(Math.random() * 12),
  }));
  return {
    schemaVersion: 2,
    name: "服务监控概览",
    datasets: [{ id: "tpl_svc", name: "服务指标", type: "static", rows: services }],
    charts: [
      {
        id: "tpl_o_latency",
        title: "服务延迟 Top8",
        datasetId: "tpl_svc",
        type: "bar",
        x: 0, y: 0, w: 6, h: 4,
        encoding: { dimension: "service", measure: "latency" },
        sort: { by: "measure", order: "desc", topN: 8 },
      },
      {
        id: "tpl_o_errors",
        title: "错误数分布",
        datasetId: "tpl_svc",
        type: "pie",
        x: 6, y: 0, w: 6, h: 4,
        encoding: { dimension: "service", measure: "errors" },
        sort: { by: "measure", order: "desc", topN: 6 },
      },
      {
        id: "tpl_o_scatter",
        title: "延迟 vs 错误",
        datasetId: "tpl_svc",
        type: "scatter",
        x: 0, y: 4, w: 6, h: 4,
        encoding: { dimension: "service", measure: "errors" },
      },
      {
        id: "tpl_o_gauge",
        title: "平均延迟",
        datasetId: "tpl_svc",
        type: "gauge",
        x: 6, y: 4, w: 6, h: 4,
        encoding: { measure: "latency" },
        aggregation: "avg",
      },
    ],
  };
}

export const BI_TEMPLATES: BiTemplate[] = [
  { key: "sales", name: "销售概览", description: "城市订单 / 销售对比 / 品类占比 / 趋势", schema: salesTemplate() },
  { key: "ops", name: "服务监控概览", description: "延迟 / 错误分布 / 相关散点 / 平均延迟仪表", schema: opsTemplate() },
];

export function getTemplate(key: string): BiTemplate | undefined {
  return BI_TEMPLATES.find((t) => t.key === key);
}
