/**
 * 网格几何：schema 栅格坐标 → 像素矩形。渲染器与设计器画布共用，
 * 保证「设计器里拖出来的」和「渲染器里看到的」是同一套数学。
 */

import type { BiChartSchema, BiDashboardSchema, BiGridConfig } from "./types";
import { CHART_DEFAULT_SIZE, defaultGrid } from "./types";
import { deepClone } from "../store/create-store";

export interface BiPlacedChart {
  chart: BiChartSchema;
  left: number;
  top: number;
  width: number;
  height: number;
  /** 解析后的栅格坐标（已补缺省并应用流式放置） */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BiLayoutResult {
  items: BiPlacedChart[];
  /** 画布总高（px） */
  height: number;
  grid: BiGridConfig;
  /** 单列宽（px，由容器宽均分） */
  colWidth: number;
}

/** 流式放置：补齐缺失的 x/y（逐行找第一块空位），不修改原对象 */
export function flowPlace(charts: BiChartSchema[], columns: number): BiChartSchema[] {
  const placed = deepClone(charts);
  const occupied = new Set<string>();
  const mark = (c: BiChartSchema) => {
    const w = c.w ?? CHART_DEFAULT_SIZE.w;
    const h = c.h ?? CHART_DEFAULT_SIZE.h;
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) occupied.add(`${(c.x ?? 0) + dx},${(c.y ?? 0) + dy}`);
    }
  };
  placed.forEach((c) => {
    if (c.x !== undefined && c.y !== undefined) {
      mark(c);
    }
  });
  for (const c of placed) {
    if (c.x !== undefined && c.y !== undefined) continue;
    const w = c.w ?? CHART_DEFAULT_SIZE.w;
    const h = c.h ?? CHART_DEFAULT_SIZE.h;
    let found = false;
    for (let y = 0; !found; y++) {
      for (let x = 0; x + w <= columns; x++) {
        let free = true;
        for (let dx = 0; dx < w && free; dx++) {
          for (let dy = 0; dy < h && free; dy++) {
            if (occupied.has(`${x + dx},${y + dy}`)) free = false;
          }
        }
        if (free) {
          c.x = x;
          c.y = y;
          mark(c);
          found = true;
          break;
        }
      }
    }
  }
  return placed;
}

/** 计算布局：容器宽度已知时产出像素矩形（渲染器/画布每次测量后调用） */
export function layoutCharts(
  charts: BiChartSchema[],
  gridInput: BiDashboardSchema["grid"],
  containerWidth: number
): BiLayoutResult {
  const grid = defaultGrid(gridInput);
  const placed = flowPlace(charts, grid.columns);
  const colWidth = containerWidth > 0 ? containerWidth / grid.columns : 0;
  const half = grid.gap / 2;

  const items: BiPlacedChart[] = placed.map((chart) => {
    const x = chart.x ?? 0;
    const y = chart.y ?? 0;
    const w = chart.w ?? CHART_DEFAULT_SIZE.w;
    const h = chart.h ?? CHART_DEFAULT_SIZE.h;
    return {
      chart,
      x,
      y,
      w,
      h,
      left: x * colWidth + half,
      top: y * grid.rowHeight + half,
      width: w * colWidth - grid.gap,
      height: h * grid.rowHeight - grid.gap,
    };
  });

  const rowsUsed = items.reduce((m, it) => Math.max(m, it.y + it.h), 0);
  return {
    items,
    height: rowsUsed * grid.rowHeight + grid.gap,
    grid,
    colWidth,
  };
}
