/**
 * @go-wind/bi-engine-s2
 *
 * AntV S2 透视表引擎适配器：注册图型 "pivot"（引擎 "s2"）。
 * 可选安装——不用就不付体积；引入并 installS2Engine() 后，
 * 设计器图型网格自动出现「透视表」，图表按 type: "pivot" 渲染。
 *
 * 编码映射：dimension = 行维度；series = 列维度（长表）；measure(s) = 值字段。
 * 数据经 bi-core transformRows 管线（过滤/聚合/排序）后进入 S2。
 */
import { PivotSheet, S2Event } from "@antv/s2";
import type { S2DataConfig, S2Options } from "@antv/s2";

import { registerEngine, registerChartType } from "@go-wind/bi-core";
import type { BiChartSchema, BiRow, ChartEngine, ChartHandle } from "@go-wind/bi-core";

type AnySheet = PivotSheet;

interface S2Build {
  dataCfg: S2DataConfig;
  options: Partial<S2Options>;
  themeType: string;
}

function buildS2Config(
  chart: BiChartSchema,
  rows: BiRow[],
  themeMode: "light" | "dark",
  width: number,
  height: number
): S2Build {
  const enc = chart.encoding ?? {};
  const rowDim = enc.dimension ?? "";
  const colDim = enc.series;
  const values = enc.measures?.length ? enc.measures : enc.measure ? [enc.measure] : [];

  const dataCfg: S2DataConfig = {
    fields: {
      rows: rowDim ? [rowDim] : [],
      columns: colDim ? [colDim] : [],
      values,
    },
    data: rows,
  };

  const options: Partial<S2Options> = {
    width: Math.max(width, 80),
    height: Math.max(height, 60),
    seriesNumber: { enable: false },
  };

  return { dataCfg, options, themeType: themeMode === "dark" ? "classicDark" : "classic" };
}

export function createS2Engine(): ChartEngine {
  return {
    mount(el, option) {
      const build = option as S2Build;
      const host = el as HTMLElement;
      build.options.width = Math.max(host.clientWidth, 80);
      build.options.height = Math.max(host.clientHeight, 60);
      const sheet = new PivotSheet(
        host,
        build.dataCfg as any,
        build.options as any
      );
      void sheet.render();
      const handle: ChartHandle = {
        update(next) {
          const b = next as S2Build;
          sheet.setDataCfg(b.dataCfg as any);
          sheet.setOptions(b.options as any);
          void sheet.render();
        },
        resize() {
          sheet.changeSheetSize(el.clientWidth, el.clientHeight);
          void sheet.render();
        },
        dispose() {
          sheet.destroy();
        },
        getDataURL() {
          const canvas = host.querySelector("canvas");
          return canvas?.toDataURL("image/png");
        },
      };
      // bindEvents 需要访问 sheet：内部约定字段
      (handle as any).__s2Sheet = sheet;
      return handle;
    },
    compile(chart, rows, theme) {
      // 尺寸占位：mount 会按宿主容器实尺寸校正（changeSheetSize）
      return buildS2Config(chart, rows, theme.mode, 320, 240) as unknown;
    },
    bindEvents(handle, cb) {
      const sheet = (handle as any).__s2Sheet as AnySheet | undefined;
      sheet?.on(S2Event.DATA_CELL_CLICK, (event: any) => {
        const detail = event?.target?.data ?? event?.target ?? {};
        cb({
          chartId: "",
          name: String(detail?.rowQuery?.[Object.keys(detail.rowQuery ?? {})[0] ?? ""] ?? detail?.value ?? ""),
          value: detail?.value,
          raw: event,
        });
      });
    },
  };
}

/** 注册引擎 + 图型（调用方在宿主入口执行一次） */
export function installS2Engine(): void {
  registerEngine("s2", createS2Engine());
  registerChartType("pivot", "s2");
}
