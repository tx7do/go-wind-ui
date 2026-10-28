/**
 * 仪表盘渲染器（只读）：schema + resolvers → 网格布局图表。
 * 与 vue 版同能力：跨图联动过滤、下钻（面包屑返回）、卡片全屏、导出 PNG。
 * 布局数学来自 bi-core 的 layoutCharts（与设计器画布同源）。
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { applyFilters, defaultGrid, layoutCharts, resolveDatasetRows } from "@go-wind-ui/bi-core";
import type {
  BiChartEvent,
  BiChartSchema,
  BiDashboardSchema,
  BiDatasetData,
} from "@go-wind-ui/bi-core";

import { useBiEnv, useBiTheme, useContainerWidth } from "./env";
import { BiChart } from "./BiChart";

export interface BiDashboardProps {
  schema: Partial<BiDashboardSchema>;
  onChartClick?: (event: BiChartEvent) => void;
  onChartSelect?: (chartId: string) => void;
  onLinkageChange?: (info: { datasetId: string; field: string; value: string } | null) => void;
}

const TOOL_BTN: React.CSSProperties = {
  width: 20,
  height: 20,
  padding: 0,
  fontSize: 12,
  lineHeight: "18px",
  color: "var(--el-text-color-secondary, #9ca3af)",
  background: "transparent",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

export function BiDashboard(props: BiDashboardProps) {
  const { schema, onChartClick, onChartSelect, onLinkageChange } = props;
  const env = useBiEnv();
  const theme = useBiTheme();
  const [rootRef, containerWidth] = useContainerWidth();
  const [rowsMap, setRowsMap] = useState<Record<string, BiDatasetData>>({});

  const cardRefs = useRef(new Map<string, HTMLDivElement | null>());
  const setCardRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  };

  // ============ 跨图联动 ============
  const linkageEnabled = schema.linkage?.enabled === true;
  const [linkageMap, setLinkageMap] = useState<Record<string, { field: string; value: string }>>({});

  const clearLinkage = (datasetId: string) => {
    setLinkageMap((prev) => {
      if (!prev[datasetId]) return prev;
      const next = { ...prev };
      delete next[datasetId];
      onLinkageChange?.(null);
      return next;
    });
  };

  const clearAllLinkage = () => {
    setLinkageMap({});
    onLinkageChange?.(null);
  };

  const handleChartClick = (event: BiChartEvent, chart: BiChartSchema) => {
    onChartClick?.(event);
    // 下钻优先：配置了下钻路径的图表，点击语义是深入一层
    if (chart.drill?.path?.length) {
      setDrillStates((prev) => {
        const st = prev[chart.id] ?? { level: 0, parents: [] as { field: string; value: string }[] };
        if (st.level >= chart.drill!.path.length - 1) return prev;
        const field = chart.drill!.path[st.level];
        return {
          ...prev,
          [chart.id]: {
            level: st.level + 1,
            parents: [...st.parents, { field, value: String(event.name ?? "") }],
          },
        };
      });
      return;
    }
    if (!linkageEnabled) return;
    const dim = chart.encoding?.dimension;
    if (!dim || event.name === undefined) return;
    const value = String(event.name);
    setLinkageMap((prev) => {
      const existing = prev[chart.datasetId];
      const next = { ...prev };
      if (existing && existing.field === dim && existing.value === value) {
        delete next[chart.datasetId];
        onLinkageChange?.(null);
      } else {
        next[chart.datasetId] = { field: dim, value };
        onLinkageChange?.({ datasetId: chart.datasetId, field: dim, value });
      }
      return next;
    });
  };

  // ============ 下钻 ============
  const [drillStates, setDrillStates] = useState<
    Record<string, { level: number; parents: { field: string; value: string }[] }>
  >({});

  const drillUp = (chartId: string) => {
    setDrillStates((prev) => {
      const st = prev[chartId];
      if (!st) return prev;
      if (st.level === 0) {
        const next = { ...prev };
        delete next[chartId];
        return next;
      }
      return { ...prev, [chartId]: { level: st.level - 1, parents: st.parents.slice(0, -1) } };
    });
  };

  const drillReset = (chartId: string) => {
    setDrillStates((prev) => {
      if (!prev[chartId]) return prev;
      const next = { ...prev };
      delete next[chartId];
      return next;
    });
  };

  const effectiveChart = (chart: BiChartSchema): BiChartSchema => {
    const st = drillStates[chart.id];
    if (!st || !chart.drill?.path?.length) return chart;
    const path = chart.drill.path;
    const dim = path[Math.min(st.level, path.length - 1)];
    const extraFilters = st.parents.map((p) => ({ field: p.field, op: "eq" as const, value: p.value }));
    return {
      ...chart,
      encoding: { ...chart.encoding, dimension: dim },
      filters: [...(chart.filters ?? []), ...extraFilters],
    };
  };

  const drillLabel = (chartId: string): string | null => {
    const st = drillStates[chartId];
    if (!st) return null;
    const chart = schema.charts?.find((c) => c.id === chartId);
    return chart?.drill?.path?.[st.level] ?? null;
  };

  // ============ 数据解析 ============
  const datasets = schema.datasets ?? [];
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        datasets.map(async (ds) => [ds.id, await resolveDatasetRows(ds, env.resolvers?.[ds.id])] as const)
      );
      if (cancelled) return;
      setRowsMap(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasets, env.resolvers]);

  /** 联动过滤后的数据集行 */
  const renderRows: Record<string, BiDatasetData> = useMemo(() => {
    const out: Record<string, BiDatasetData> = {};
    for (const [id, data] of Object.entries(rowsMap)) {
      const hit = linkageMap[id];
      out[id] = hit
        ? { ...data, rows: applyFilters(data.rows, [{ field: hit.field, op: "eq", value: hit.value }]) }
        : data;
    }
    return out;
  }, [rowsMap, linkageMap]);

  const layout = useMemo(
    () => layoutCharts(schema.charts ?? [], schema.grid, containerWidth),
    [schema.charts, schema.grid, containerWidth]
  );

  const emptyText = env.emptyText ?? "暂无数据";

  // ============ 卡片工具 ============
  const canvasToPng = (canvas: HTMLCanvasElement): string => {
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    return out.toDataURL("image/png");
  };

  const exportChart = (chartId: string, title?: string) => {
    const canvas = cardRefs.current.get(chartId)?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvasToPng(canvas);
    a.download = `${title ?? chartId}.png`;
    a.click();
  };

  const fullscreen = (chartId: string) => {
    const el = cardRefs.current.get(chartId);
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void el.requestFullscreen?.()?.catch((err: unknown) => console.error("[bi] fullscreen failed", err));
  };

  return (
    <div ref={rootRef} className="bi-dashboard" style={{ position: "relative", width: "100%", height: layout.height }}>
      {layout.items.map((item) => {
        const data = renderRows[item.chart.datasetId] ?? { rows: [], loading: false, error: null };
        const drillLabel_ = drillLabel(item.chart.id);
        const linkageHit = linkageMap[item.chart.datasetId];
        return (
          <div
            key={item.chart.id}
            ref={setCardRef(item.chart.id)}
            className="bi-dashboard__card"
            style={{
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              padding: "10px 12px",
              overflow: "hidden",
              background: "var(--el-bg-color, #fff)",
              border: "1px solid var(--el-border-color-lighter, #ebeef5)",
              borderRadius: 8,
              left: item.left,
              top: item.top,
              width: item.width,
              height: item.height,
            }}
            onClick={() => onChartSelect?.(item.chart.id)}
          >
            {(item.chart.title || drillLabel_) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexShrink: 0,
                  marginBottom: 4,
                  minHeight: 20,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--el-text-color-primary, #1f2937)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.chart.title || drillLabel_}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  {drillLabel_ && (
                    <button style={TOOL_BTN} title="返回上一层" onClick={(e) => { e.stopPropagation(); drillUp(item.chart.id); }}>
                      ↩
                    </button>
                  )}
                  {item.chart.drill?.path?.length ? (
                    <button style={TOOL_BTN} title="重置下钻" onClick={(e) => { e.stopPropagation(); drillReset(item.chart.id); }}>
                      ⤾
                    </button>
                  ) : null}
                  {linkageHit && (
                    <button
                      style={{ ...TOOL_BTN, color: "var(--el-color-warning, #e6a23c)" }}
                      title={`联动: ${linkageHit.value}`}
                      onClick={(e) => { e.stopPropagation(); clearLinkage(item.chart.datasetId); }}
                    >
                      ◉
                    </button>
                  )}
                  <button style={TOOL_BTN} title="导出图片" onClick={(e) => { e.stopPropagation(); exportChart(item.chart.id, item.chart.title); }}>
                    ⇩
                  </button>
                  <button style={TOOL_BTN} title="全屏" onClick={(e) => { e.stopPropagation(); fullscreen(item.chart.id); }}>
                    ⛶
                  </button>
                </div>
              </div>
            )}
            <div style={{ flex: 1, minHeight: 0 }}>
              <BiChart
                chart={effectiveChart(item.chart)}
                rows={data.rows}
                theme={theme}
                error={data.error}
                emptyText={emptyText}
                onChartClick={(e) => handleChartClick(e, item.chart)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

