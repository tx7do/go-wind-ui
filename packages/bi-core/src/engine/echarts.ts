/**
 * ECharts 引擎适配器（默认内置引擎）。
 * 按需注册图表与组件（素材：go-wind-admin ele 端 plugins/echarts 注册表），
 * 避免 import * as echarts from 'echarts' 的全量引入。
 */
import * as echarts from "echarts/core";
import { BarChart, GaugeChart, LineChart, PieChart, RadarChart, ScatterChart } from "echarts/charts";
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
} from "echarts/components";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

import type {
  BarSeriesOption,
  GaugeSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
  RadarSeriesOption,
  ScatterSeriesOption,
} from "echarts/charts";
import type { ComposeOption } from "echarts/core";
import type {
  GridComponentOption,
  LegendComponentOption,
  TitleComponentOption,
  TooltipComponentOption,
} from "echarts/components";

import { getColumns, toNumber, unique } from "../dataset";
import { resolveTheme } from "../theme";
import type { BiChartSchema, BiRow } from "../schema/types";
import type { BiChartEvent, ChartEngine, ChartHandle } from "./types";
import { registerEngine } from "./types";

let registered = false;

function ensureRegistered() {
  if (registered) return;
  registered = true;
  echarts.use([
    BarChart,
    LineChart,
    PieChart,
    ScatterChart,
    RadarChart,
    GaugeChart,
    DatasetComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
    TooltipComponent,
    TransformComponent,
    LabelLayout,
    UniversalTransition,
    CanvasRenderer,
  ]);
}

export type BiEChartsOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | ScatterSeriesOption
  | RadarSeriesOption
  | GaugeSeriesOption
  | TitleComponentOption
  | LegendComponentOption
  | TooltipComponentOption
  | GridComponentOption
>;

/** 轴最大值取整到「好看的刻度」（1/2/5×10^n） */
function niceMax(value: number): number {
  if (value <= 0) return 100;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const scaled = value / base;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return nice * base;
}

function axisStyles(theme: ReturnType<typeof resolveTheme>) {
  return {
    axisLabel: { color: theme.subText },
    axisLine: { lineStyle: { color: theme.axisLine } },
    axisTick: { lineStyle: { color: theme.axisLine } },
  };
}

function tooltipStyles(theme: ReturnType<typeof resolveTheme>) {
  return {
    backgroundColor: theme.tooltipBg,
    borderColor: theme.axisLine,
    textStyle: { color: theme.text },
  };
}

/** schema + 行数据 + 主题模式 → ECharts option */
export function compileEcharts(
  chart: BiChartSchema,
  rows: BiRow[],
  themeMode: "light" | "dark"
): BiEChartsOption {
  const theme = resolveTheme(themeMode);
  const enc = chart.encoding ?? {};
  const base: BiEChartsOption = {
    backgroundColor: "transparent",
    color: theme.palette,
    textStyle: { color: theme.text },
    tooltip: tooltipStyles(theme),
  };
  // 引擎原生透传：浅合并每个顶层键（嵌套覆盖用整键替换语义）
  const passthrough = (chart.options ?? {}) as object;

  const cartesian = (series: any[], categories: string[], area: boolean): BiEChartsOption => ({
    ...base,
    legend: enc.series
      ? { top: 0, textStyle: { color: theme.subText }, itemWidth: 14, itemHeight: 8 }
      : undefined,
    grid: { left: 8, right: 16, top: enc.series ? 32 : 20, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: categories,
      ...axisStyles(theme),
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      ...axisStyles(theme),
      splitLine: { lineStyle: { color: theme.splitLine } },
    },
    series: series.map((s) => ({
      smooth: true,
      ...(area ? { areaStyle: { opacity: 0.15 } } : {}),
      ...s,
    })),
  });

  switch (chart.type) {
    case "bar":
    case "line":
    case "area":
    case "scatter": {
      const cols = getColumns(rows);
      const dim = enc.dimension ?? cols[0] ?? "";
      const measure = enc.measure ?? cols.find((c) => c !== dim) ?? "";
      // ECharts 无 area 系列：面积 = line + areaStyle（cartesian 已按 area 注入）
      const seriesType = chart.type === "area" ? "line" : chart.type;
      const categories = unique(rows.map((r) => String(r[dim] ?? "")));

      let series: any[];
      if (chart.type === "scatter") {
        const group = (name: string, subset: BiRow[]) => ({
          name,
          type: "scatter" as const,
          data: subset.map((r) => [r[dim], toNumber(r[measure])]),
          symbolSize: 10,
        });
        series = enc.series
          ? unique(rows.map((r) => String(r[enc.series!]))).map((sn) =>
              group(sn, rows.filter((r) => String(r[enc.series!]) === sn))
            )
          : [group(chart.title ?? measure, rows)];
      } else if (enc.series) {
        const seriesNames = unique(rows.map((r) => String(r[enc.series!])));
        series = seriesNames.map((sn) => {
          const subset = rows.filter((r) => String(r[enc.series!]) === sn);
          const data = categories.map((c) => {
            const hit = subset.find((r) => String(r[dim]) === c);
            return hit ? toNumber(hit[measure]) : null;
          });
          return { name: sn, type: seriesType, data };
        });
      } else {
        series = [
          {
            name: chart.title ?? measure,
            type: seriesType,
            data: categories.map((c) =>
              toNumber(rows.find((r) => String(r[dim]) === c)?.[measure])
            ),
          },
        ];
      }
      return {
        ...cartesian(series, categories, chart.type === "area"),
        ...passthrough,
      } as BiEChartsOption;
    }

    case "pie":
    case "donut": {
      const cols = getColumns(rows);
      const dim = enc.dimension ?? cols[0] ?? "name";
      const measure = enc.measure ?? cols.find((c) => c !== dim) ?? "value";
      return {
        ...base,
        legend: { bottom: 0, textStyle: { color: theme.subText }, itemWidth: 14, itemHeight: 8 },
        series: [
          {
            type: "pie",
            radius: chart.type === "donut" ? ["42%", "68%"] : "68%",
            center: ["50%", "46%"],
            itemStyle: { borderColor: "transparent", borderWidth: 2 },
            label: { color: theme.subText },
            data: rows.map((r) => ({
              name: String(r[dim] ?? ""),
              value: toNumber(r[measure]),
            })),
          },
        ],
        ...passthrough,
      } as BiEChartsOption;
    }

    case "radar": {
      const cols = getColumns(rows);
      const dim = enc.dimension ?? cols[0] ?? "name";
      const measure = enc.measure ?? cols.find((c) => c !== dim) ?? "value";
      const max = niceMax(Math.max(...rows.map((x) => toNumber(x[measure])), 1));
      const indicators = rows.map((r) => ({ name: String(r[dim] ?? ""), max }));

      let data: any[];
      if (enc.series) {
        const seriesNames = unique(rows.map((r) => String(r[enc.series!])));
        data = seriesNames.map((sn) => ({
          name: sn,
          value: rows
            .filter((r) => String(r[enc.series!]) === sn)
            .map((r) => toNumber(r[measure])),
        }));
      } else {
        data = [{ name: chart.title ?? measure, value: rows.map((r) => toNumber(r[measure])) }];
      }
      return {
        ...base,
        legend: enc.series
          ? { bottom: 0, textStyle: { color: theme.subText }, itemWidth: 14, itemHeight: 8 }
          : undefined,
        radar: {
          indicator: indicators,
          center: ["50%", "50%"],
          radius: "62%",
          axisName: { color: theme.subText },
          axisLine: { lineStyle: { color: theme.axisLine } },
          splitLine: { lineStyle: { color: theme.splitLine } },
          splitArea: { show: false },
        },
        series: [{ type: "radar", data, areaStyle: { opacity: 0.12 } }],
        ...passthrough,
      } as BiEChartsOption;
    }

    case "gauge": {
      const cols = getColumns(rows);
      const measure = enc.measure ?? cols[0] ?? "value";
      const value = toNumber(rows[0]?.[measure]);
      const max = niceMax(Math.max(value, 100));
      return {
        ...base,
        series: [
          {
            type: "gauge",
            min: 0,
            max,
            startAngle: 210,
            endAngle: -30,
            progress: { show: true, width: 12 },
            axisLine: { lineStyle: { width: 12, color: [[1, theme.splitLine]] } },
            axisTick: { show: false },
            splitLine: { length: 6, lineStyle: { color: theme.axisLine } },
            axisLabel: { color: theme.subText, distance: 16, fontSize: 10 },
            pointer: { itemStyle: { color: "auto" } },
            detail: {
              valueAnimation: true,
              formatter: "{value}",
              color: theme.text,
              fontSize: 22,
              offsetCenter: [0, "62%"],
            },
            data: [{ value }],
          },
        ],
        ...passthrough,
      } as BiEChartsOption;
    }

    default:
      throw new Error(`[bi] unsupported chart type: ${(chart as any).type}`);
  }
}

/**
 * 创建 ECharts 引擎实例（幂等注册 echarts 模块）。
 * handle 上带内部约定字段 __echartsInstance 供 bindEvents 取实例。
 */
export function createEchartsEngine(): ChartEngine {
  ensureRegistered();
  return {
    mount(el, option) {
      const instance = echarts.init(el);
      instance.setOption(option as any);
      const handle: ChartHandle & { __echartsInstance?: echarts.ECharts } = {
        __echartsInstance: instance,
        update(next) {
          instance.setOption(next as any);
        },
        resize() {
          instance.resize();
        },
        dispose() {
          instance.dispose();
        },
      };
      return handle;
    },
    compile(chart, rows, theme) {
      return compileEcharts(chart, rows, theme.mode);
    },
    bindEvents(handle, cb) {
      const inst = (handle as any).__echartsInstance as echarts.ECharts | undefined;
      inst?.on("click", (params: any) => {
        const e: BiChartEvent = {
          chartId: "",
          seriesName: params?.seriesName,
          name: params?.name,
          value: params?.value,
          raw: params,
        };
        cb(e);
      });
    },
  };
}

/** 默认注册（调用方引入本模块后执行一次；重复注册无害） */
export function installEchartsEngine(): void {
  registerEngine("echarts", createEchartsEngine());
}
