/**
 * 仪表盘渲染器（只读）：schema + resolvers → 网格布局图表。
 * 布局数学来自 bi-core 的 layoutCharts（与设计器画布同源）。
 */
import { useEffect, useMemo, useState } from "react";

import { defaultGrid, layoutCharts, resolveDatasetRows } from "@go-wind-ui/bi-core";
import type {
  BiChartEvent,
  BiDashboardSchema,
  BiDatasetData,
} from "@go-wind-ui/bi-core";

import { useBiEnv, useBiTheme, useContainerWidth } from "./env";
import { BiChart } from "./BiChart";

export interface BiDashboardProps {
  schema: Partial<BiDashboardSchema>;
  onChartClick?: (event: BiChartEvent) => void;
  onChartSelect?: (chartId: string) => void;
}

export function BiDashboard(props: BiDashboardProps) {
  const { schema, onChartClick, onChartSelect } = props;
  const env = useBiEnv();
  const theme = useBiTheme();
  const [rootRef, containerWidth] = useContainerWidth();
  const [rowsMap, setRowsMap] = useState<Record<string, BiDatasetData>>({});

  const datasets = schema.datasets ?? [];

  // 数据解析：datasets/resolvers 变化时全部重取
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

  const layout = useMemo(
    () => layoutCharts(schema.charts ?? [], schema.grid, containerWidth),
    [schema.charts, schema.grid, containerWidth]
  );

  const emptyText = env.emptyText ?? "暂无数据";

  return (
    <div ref={rootRef} className="bi-dashboard" style={{ position: "relative", width: "100%", height: layout.height }}>
      {layout.items.map((item) => {
        const data = rowsMap[item.chart.datasetId] ?? { rows: [], loading: false, error: null };
        return (
          <div
            key={item.chart.id}
            className="bi-dashboard__card"
            style={{
              left: item.left,
              top: item.top,
              width: item.width,
              height: item.height,
            }}
            onClick={() => onChartSelect?.(item.chart.id)}
          >
            {item.chart.title && (
              <div className="bi-dashboard__card-title">{item.chart.title}</div>
            )}
            <div style={{ flex: 1, minHeight: 0 }}>
              <BiChart
                chart={item.chart}
                rows={data.rows}
                theme={theme}
                error={data.error}
                emptyText={emptyText}
                onChartClick={onChartClick}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
