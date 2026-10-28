/**
 * @go-wind-ui/bi-engine-g6
 *
 * AntV G6 关系图引擎适配器：注册图型 "graph"（引擎 "g6"）。
 * 可选安装——不用就不付体积；引入并 installG6Engine() 后，
 * 设计器图型网格自动出现「关系图」。
 *
 * 编码映射（行 = 边列表）：dimension = 起点字段，series = 终点字段，
 * measure = 边权重（线宽）。数据经 bi-core transformRows 管线。
 */
import { Graph } from "@antv/g6";

import { registerChartType, registerEngine } from "@go-wind-ui/bi-core";
import type { BiChartSchema, BiRow, ChartEngine, ChartHandle } from "@go-wind-ui/bi-core";

/** compile 产物：G6 options（不含 container） */
interface G6Build {
  data: { nodes: { id: string }[]; edges: { source: string; target: string; size?: number }[] };
  layout: Record<string, unknown>;
  node: Record<string, unknown>;
  edge: Record<string, unknown>;
  behaviors: string[];
  autoFit: string;
  animation: boolean;
}

function buildG6Options(
  chart: BiChartSchema,
  rows: BiRow[],
  themeMode: "light" | "dark"
): G6Build {
  const enc = chart.encoding ?? {};
  const sourceField = enc.dimension ?? "source";
  const targetField = enc.series ?? "target";
  const weightField = enc.measure;

  const nodeIds = new Set<string>();
  const edges: G6Build["data"]["edges"] = [];
  for (const row of rows) {
    const source = String(row[sourceField] ?? "");
    const target = String(row[targetField] ?? "");
    if (!source || !target) continue;
    nodeIds.add(source);
    nodeIds.add(target);
    const weight = weightField ? Number(row[weightField]) : NaN;
    edges.push({ source, target, size: Number.isFinite(weight) ? Math.max(2, Math.min(10, weight / 50 + 2)) : undefined });
  }

  const labelColor = themeMode === "dark" ? "#e5eaf3" : "#1f2937";

  return {
    data: {
      nodes: [...nodeIds].map((id) => ({ id })),
      edges: edges.map((e) => ({ source: e.source, target: e.target, size: e.size })),
    },
    layout: { type: "force", linkDistance: 110, nodeStrength: -300, preventOverlap: true },
    node: {
      style: { labelText: (d: any) => String(d.id ?? ""), labelFill: labelColor, labelFontSize: 11, size: 22 },
    },
    edge: {
      style: {
        stroke: themeMode === "dark" ? "#4c4d4f" : "#c0c4cc",
        lineWidth: (d: any) => Number(d.size ?? 2),
        endArrow: true,
      },
    },
    behaviors: ["zoom-canvas", "drag-canvas", "drag-element"],
    autoFit: "view",
    animation: false,
  };
}

export function createG6Engine(): ChartEngine {
  return {
    mount(el, option) {
      const host = el as HTMLElement;
      const build = option as G6Build;
      const graph = new Graph({
        container: host,
        ...(build as any),
        width: Math.max(host.clientWidth, 80),
        height: Math.max(host.clientHeight, 60),
      });
      // G6 v5 render 为异步：挂起 Promise 串行化后续 setData/render
      let pending: Promise<unknown> = Promise.resolve();
      pending = pending.then(() => graph.render()).catch((err) => console.error("[bi-g6] render failed", err));

      const handle: ChartHandle = {
        update(next) {
          pending = pending
            .then(() => {
              graph.setData((next as G6Build).data);
              return graph.render();
            })
            .catch((err) => console.error("[bi-g6] update failed", err));
        },
        resize() {
          pending = pending
            .then(() => {
              graph.setSize(Math.max(host.clientWidth, 80), Math.max(host.clientHeight, 60));
              return graph.render();
            })
            .catch((err) => console.error("[bi-g6] resize failed", err));
        },
        dispose() {
          pending = pending
            .then(() => graph.destroy())
            .catch((err) => console.error("[bi-g6] destroy failed", err));
        },
        getDataURL() {
          return host.querySelector("canvas")?.toDataURL("image/png");
        },
      };
      (handle as any).__g6Graph = graph;
      return handle;
    },
    compile(chart, rows, theme) {
      return buildG6Options(chart, rows, theme.mode) as unknown;
    },
    bindEvents(handle, cb) {
      const graph = (handle as any).__g6Graph as Graph | undefined;
      graph?.on("node:click", (evt: any) => {
        cb({ chartId: "", name: String(evt.target?.id ?? ""), raw: evt });
      });
      graph?.on("edge:click", (evt: any) => {
        const model = evt.target?.context?.edgeData ?? {};
        cb({
          chartId: "",
          name: `${model.source ?? ""}->${model.target ?? ""}`,
          value: model.size,
          raw: evt,
        });
      });
    },
  };
}

/** 注册引擎 + 图型（调用方在宿主入口执行一次） */
export function installG6Engine(): void {
  registerEngine("g6", createG6Engine());
  registerChartType("graph", "g6");
}
