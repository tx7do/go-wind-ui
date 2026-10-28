/**
 * 单图表渲染：引擎挂载 + 行数据/主题变化重编译 + ResizeObserver 跟随。
 * 空数据不挂引擎，只显示占位文案。
 */
import { useEffect, useRef, useState } from "react";

import { getEngine } from "@go-wind-ui/bi-core";
import type { BiChartEvent, BiChartSchema, BiResolvedTheme, ChartHandle } from "@go-wind-ui/bi-core";

export interface BiChartProps {
  chart: BiChartSchema;
  rows: Record<string, any>[];
  theme: BiResolvedTheme;
  error?: string | null;
  emptyText?: string;
  onChartClick?: (event: BiChartEvent) => void;
}

export function BiChart(props: BiChartProps) {
  const { chart, rows, theme, error, emptyText, onChartClick } = props;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<ChartHandle | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);

  // 点击回调进 ref：避免 onChartClick 变化触发图表重建
  const clickRef = useRef(onChartClick);
  clickRef.current = onChartClick;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !rows.length) {
      // 空数据：拆引擎
      observerRef.current?.disconnect();
      observerRef.current = null;
      handleRef.current?.dispose();
      handleRef.current = null;
      setReady(false);
      return;
    }

    const engine = getEngine(chart.engine);
    if (!handleRef.current) {
      handleRef.current = engine.mount(host, engine.compile(chart, rows, theme));
      engine.bindEvents(handleRef.current, (e) =>
        clickRef.current?.({ ...e, chartId: chart.id })
      );
      observerRef.current = new ResizeObserver(() => handleRef.current?.resize());
      observerRef.current.observe(host);
      setReady(true);
    } else {
      handleRef.current.update(engine.compile(chart, rows, theme));
    }
  }, [chart, rows, theme]);

  // 卸载清理
  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      handleRef.current?.dispose();
      handleRef.current = null;
    },
    []
  );

  return (
    <div
      className="bi-chart"
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <div
        ref={hostRef}
        className="bi-chart__host"
        style={{ visibility: ready ? "visible" : "hidden", width: "100%", height: "100%" }}
      />
      {!rows.length && (
        <div
          className="bi-chart__empty"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--el-text-color-secondary, #909399)",
            fontSize: 13,
            userSelect: "none",
          }}
        >
          {emptyText ?? "暂无数据"}
        </div>
      )}
      {rows.length > 0 && error && (
        <div
          title={error}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "var(--el-color-danger, #f56c6c)",
            color: "#fff",
            fontSize: 11,
            cursor: "help",
          }}
        >
          !
        </div>
      )}
    </div>
  );
}
