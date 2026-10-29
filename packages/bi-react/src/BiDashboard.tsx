/**
 * 仪表盘渲染器（只读）：schema + resolvers → 网格布局图表。
 * 与 vue 版同能力：跨图联动过滤、下钻（面包屑返回）、卡片全屏、导出 PNG。
 * 布局数学来自 bi-core 的 layoutCharts（与设计器画布同源）。
 */
import { useEffect, useMemo, useRef, useState } from "react";

import {
  applyFilters,
  defaultGrid,
  getDashboardThemePreset,
  layoutCharts,
  resolveDashboardTheme,
  resolveDatasetRows,
} from "@go-wind/bi-core";
import type { BiDashboardThemePreset } from "@go-wind/bi-core";
import type {
  BiChartEvent,
  BiChartSchema,
  BiDashboardSchema,
  BiDatasetData,
} from "@go-wind/bi-core";

import { useBiEnv, useBiTheme, useContainerWidth } from "./env";
import { BiChart } from "./BiChart";

export interface BiDashboardProps {
  schema: Partial<BiDashboardSchema>;
  /**
   * 大屏视图：设计稿宽度 + 等比缩放
   * - width：按容器宽缩放，高度随内容（页面可滚动）
   * - contain：按容器宽高双向取小值缩放并居中，内容整体撑满容器、不滚动
   * - none：原样 1:1
   */
  view?: { designWidth?: number; fit?: "width" | "contain" | "none" };
  onChartClick?: (event: BiChartEvent) => void;
  onChartSelect?: (chartId: string) => void;
  onLinkageChange?: (info: { datasetId: string; field: string; value: string } | null) => void;
}

// 工具按钮颜色走 .bi-dashboard__tool 类（styles.css 含暗色分支），inline 只留定位
const TOOL_BTN: React.CSSProperties = {
  width: 20,
  height: 20,
  padding: 0,
  lineHeight: "18px",
};

export function BiDashboard(props: BiDashboardProps) {
  const { schema, view, onChartClick, onChartSelect, onLinkageChange } = props;
  const env = useBiEnv();
  const autoTheme = useBiTheme();
  const theme = useMemo(
    () => resolveDashboardTheme(schema.theme?.key, autoTheme.mode === "dark").theme,
    [schema.theme?.key, autoTheme]
  );
  const themePreset: BiDashboardThemePreset | null = useMemo(
    () => getDashboardThemePreset(schema.theme?.key),
    [schema.theme?.key]
  );
  const chromeVars = useMemo(() => {
    const preset = themePreset;
    if (!preset) return {} as Record<string, string>;
    const vars: Record<string, string> = {
      "--bi-card-bg": preset.cardBg ?? "",
      "--bi-card-border": preset.cardBorder ?? "",
      "--bi-card-text": preset.cardTitle ?? "",
    };
    if (preset.canvasBg) vars["--bi-canvas-bg"] = preset.canvasBg;
    return vars;
  }, [themePreset]);
  const [rootRef, containerWidth, containerHeight] = useContainerWidth();
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

  const fitMode = view?.fit ?? "none";
  const designWidth = view?.designWidth ?? 1920;
  const layoutWidth = fitMode === "none" ? containerWidth : designWidth;

  const layout = useMemo(
    () => layoutCharts(schema.charts ?? [], schema.grid, layoutWidth),
    [schema.charts, schema.grid, layoutWidth]
  );

  let scaleFactor = 1;
  if (fitMode !== "none" && containerWidth > 0) {
    const byWidth = containerWidth / designWidth;
    if (fitMode === "width") scaleFactor = byWidth;
    else if (containerHeight > 0 && layout.height > 0)
      scaleFactor = Math.min(byWidth, containerHeight / layout.height);
    else scaleFactor = byWidth;
  }

  // contain：root 铺满容器（高度由宿主给定）并居中缩放层；其余按缩放后内容高度
  const containMode = fitMode === "contain";
  const scaledWidth = designWidth * scaleFactor;
  const scaledHeight = layout.height * scaleFactor;
  const stageStyle: React.CSSProperties = {
    width: layoutWidth,
    height: layout.height,
    transform: `scale(${scaleFactor})`,
    transformOrigin: "0 0",
    position: containMode ? "absolute" : "relative",
    ...(containMode
      ? {
          left: Math.max(0, (containerWidth - scaledWidth) / 2),
          top: Math.max(0, (containerHeight - scaledHeight) / 2),
        }
      : {}),
  };

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
    <div
      ref={rootRef}
      className="bi-dashboard"
      style={{
        position: "relative",
        width: "100%",
        height: containMode ? "100%" : Math.round(scaledHeight),
        overflow: containMode ? "hidden" : undefined,
        background: "var(--bi-canvas-bg, transparent)",
        ...chromeVars,
      } as React.CSSProperties}
    >
      <div style={stageStyle}>
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
              // 视觉（背景/边框/文字色）不在这里写：inline 会压过 styles.css 的
              // html.dark 分支，auto 主题下切暗卡片永远不变。样式统一走类。
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              padding: "10px 12px",
              overflow: "hidden",
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
                  className="bi-dashboard__card-title"
                  style={{ flex: 1, minWidth: 0 }}
                >
                  {item.chart.title || drillLabel_}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  {drillLabel_ && (
                    <button className="bi-dashboard__tool" style={TOOL_BTN} title="返回上一层" onClick={(e) => { e.stopPropagation(); drillUp(item.chart.id); }}>
                      ↩
                    </button>
                  )}
                  {item.chart.drill?.path?.length ? (
                    <button className="bi-dashboard__tool" style={TOOL_BTN} title="重置下钻" onClick={(e) => { e.stopPropagation(); drillReset(item.chart.id); }}>
                      ⤾
                    </button>
                  ) : null}
                  {linkageHit && (
                    <button
                      className="bi-dashboard__tool bi-dashboard__tool--linkage"
                      style={TOOL_BTN}
                      title={`联动: ${linkageHit.value}`}
                      onClick={(e) => { e.stopPropagation(); clearLinkage(item.chart.datasetId); }}
                    >
                      ◉
                    </button>
                  )}
                  <button className="bi-dashboard__tool" style={TOOL_BTN} title="导出图片" onClick={(e) => { e.stopPropagation(); exportChart(item.chart.id, item.chart.title); }}>
                    ⇩
                  </button>
                  <button className="bi-dashboard__tool" style={TOOL_BTN} title="全屏" onClick={(e) => { e.stopPropagation(); fullscreen(item.chart.id); }}>
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
    </div>
  );
}

