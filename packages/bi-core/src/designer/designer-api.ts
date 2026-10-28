/**
 * BiDesignerApi —— 设计器状态机（框架无关）。
 *
 * 纯 TS 类 + 微型订阅 store：React 用 useSyncExternalStore(api.subscribe, api.getSnapshot)，
 * Vue 用 api.subscribe(() => state.value = api.getSnapshot())。
 * 所有 mutation 走 commit()：深拷贝出下一状态整体替换（快照语义）+ 撤销栈快照。
 */

import {
  CHART_DEFAULT_SIZE,
  genId,
  migrateSchema,
  normalizeSchema,
} from "../schema/types";
import type {
  BiChartSchema,
  BiChartType,
  BiDashboardSchema,
  BiDatasetSchema,
} from "../schema/types";
import { createTinyStore, deepClone } from "../store/create-store";
import type { TinyStore } from "../store/create-store";

const UNDO_LIMIT = 50;

/** 画布操作默认尺寸下限（栅格单位） */
export const CHART_MIN_SIZE = { w: 3, h: 2 };

export class BiDesignerApi {
  private store: TinyStore<BiDashboardSchema>;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private selectedChartId: string | null = null;

  constructor(initial?: Partial<BiDashboardSchema>) {
    this.store = createTinyStore(normalizeSchema(initial ?? {}));
  }

  // ============ 订阅（React useSyncExternalStore / Vue subscribe 两用） ============

  subscribe = (listener: () => void): (() => void) => this.store.subscribe(listener);

  getSnapshot = (): BiDashboardSchema => this.store.getState();

  private emit() {
    // 整体替换为新快照：select() 等不落撤销栈的操作也要让订阅方（shallowRef /
    // useSyncExternalStore）感知变化——同一对象引用不会触发任何框架更新
    this.store.set(deepClone(this.store.getState()));
  }

  /** 深拷贝出下一状态 → mutator 原地改 → 整体替换 + 撤销栈快照 */
  private commit(mutator: (draft: BiDashboardSchema) => void) {
    this.undoStack.push(JSON.stringify(this.store.getState()));
    if (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift();
    this.redoStack = [];
    const draft = deepClone(this.store.getState());
    mutator(draft);
    this.store.set(draft);
  }

  // ============ 撤销 / 重做 ============

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo() {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(JSON.stringify(this.store.getState()));
    this.store.set(JSON.parse(prev));
    this.pruneSelection();
  }

  redo() {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(JSON.stringify(this.store.getState()));
    this.store.set(JSON.parse(next));
    this.pruneSelection();
  }

  private pruneSelection() {
    if (this.selectedChartId && !this.getChart(this.selectedChartId)) {
      this.selectedChartId = null;
      this.emit();
    }
  }

  // ============ 选中 ============

  get selectedId(): string | null {
    return this.selectedChartId;
  }

  select(id: string | null) {
    if (this.selectedChartId === id) return;
    this.selectedChartId = id;
    this.emit();
  }

  getSelected(): BiChartSchema | null {
    return this.selectedChartId ? this.getChart(this.selectedChartId) : null;
  }

  // ============ 图表 ============

  getChart(id: string): BiChartSchema | null {
    return this.store.getState().charts.find((c) => c.id === id) ?? null;
  }

  /** 新增图表：自动流式放置（找第一行放得下的位置），返回新图表 id */
  addChart(init?: Partial<BiChartSchema>): string {
    const state = this.store.getState();
    const id = init?.id ?? genId("chart");
    const w = init?.w ?? CHART_DEFAULT_SIZE.w;
    const h = init?.h ?? CHART_DEFAULT_SIZE.h;
    const { x, y } = init?.x !== undefined && init?.y !== undefined
      ? { x: init.x, y: init.y }
      : this.findFreeSpot(state, w, h);
    const firstDataset = state.datasets[0]?.id ?? "";
    this.commit((draft) => {
      draft.charts.push({
        id,
        title: init?.title,
        datasetId: init?.datasetId ?? firstDataset,
        engine: init?.engine ?? "echarts",
        type: (init?.type ?? "bar") as BiChartType,
        x,
        y,
        w,
        h,
        encoding: init?.encoding ?? {},
      });
    });
    this.select(id);
    return id;
  }

  /** 找第一块放得下 (w×h) 的空位（逐行扫描，允许与列数取整） */
  private findFreeSpot(
    state: BiDashboardSchema,
    w: number,
    h: number
  ): { x: number; y: number } {
    const cols = state.grid?.columns ?? 12;
    const occupied = new Set<string>();
    for (const c of state.charts) {
      for (let dx = 0; dx < (c.w ?? 6); dx++) {
        for (let dy = 0; dy < (c.h ?? 4); dy++) {
          occupied.add(`${(c.x ?? 0) + dx},${(c.y ?? 0) + dy}`);
        }
      }
    }
    const maxY = state.charts.reduce((m, c) => Math.max(m, (c.y ?? 0) + (c.h ?? 4)), 0);
    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x + w <= cols; x++) {
        let free = true;
        for (let dx = 0; dx < w && free; dx++) {
          for (let dy = 0; dy < h && free; dy++) {
            if (occupied.has(`${x + dx},${y + dy}`)) free = false;
          }
        }
        if (free) return { x, y };
      }
    }
    return { x: 0, y: maxY };
  }

  updateChart(id: string, patch: Partial<BiChartSchema>) {
    this.commit((draft) => {
      const chart = draft.charts.find((c) => c.id === id);
      if (!chart) return;
      Object.assign(chart, patch);
      // encoding/options 是子对象：整体替换语义，避免残留旧键
      if (patch.encoding !== undefined) chart.encoding = { ...patch.encoding };
      if (patch.options !== undefined) chart.options = { ...patch.options };
    });
  }

  moveChart(id: string, x: number, y: number) {
    this.commit((draft) => {
      const chart = draft.charts.find((c) => c.id === id);
      if (!chart) return;
      chart.x = Math.max(0, Math.round(x));
      chart.y = Math.max(0, Math.round(y));
    });
  }

  resizeChart(id: string, w: number, h: number) {
    this.commit((draft) => {
      const cols = draft.grid?.columns ?? 12;
      const chart = draft.charts.find((c) => c.id === id);
      if (!chart) return;
      chart.w = Math.min(cols, Math.max(CHART_MIN_SIZE.w, Math.round(w)));
      chart.h = Math.max(CHART_MIN_SIZE.h, Math.round(h));
    });
  }

  removeChart(id: string) {
    this.commit((draft) => {
      draft.charts = draft.charts.filter((c) => c.id !== id);
    });
    if (this.selectedChartId === id) this.select(null);
  }

  /** 流式重排所有图表 y 坐标（压掉洞） */
  compact() {
    this.commit((draft) => {
      const sorted = [...draft.charts].sort(
        (a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0)
      );
      const occupied = new Set<string>();
      for (const c of sorted) {
        const w = c.w ?? 6;
        const h = c.h ?? 4;
        let placed = false;
        for (let y = 0; !placed; y++) {
          for (let x = 0; x + w <= (draft.grid?.columns ?? 12); x++) {
            let free = true;
            for (let dx = 0; dx < w && free; dx++) {
              for (let dy = 0; dy < h && free; dy++) {
                if (occupied.has(`${x + dx},${y + dy}`)) free = false;
              }
            }
            if (free) {
              c.x = x;
              c.y = y;
              for (let dx = 0; dx < w; dx++) {
                for (let dy = 0; dy < h; dy++) occupied.add(`${x + dx},${y + dy}`);
              }
              placed = true;
              break;
            }
          }
        }
      }
      draft.charts = sorted;
    });
  }

  // ============ 数据集 ============

  addDataset(init: Partial<BiDatasetSchema> & { name: string }): string {
    const id = init.id ?? genId("ds");
    this.commit((draft) => {
      draft.datasets.push({
        id,
        name: init.name,
        type: init.type ?? "static",
        rows: init.rows ?? [],
        api: init.api,
      });
    });
    return id;
  }

  updateDataset(id: string, patch: Partial<BiDatasetSchema>) {
    this.commit((draft) => {
      const ds = draft.datasets.find((d) => d.id === id);
      if (!ds) return;
      Object.assign(ds, patch);
    });
  }

  removeDataset(id: string) {
    this.commit((draft) => {
      draft.datasets = draft.datasets.filter((d) => d.id !== id);
      // 引用该数据集的图表一并删除（否则渲染必然报错）
      draft.charts = draft.charts.filter((c) => c.datasetId !== id);
    });
    this.pruneSelection();
  }

  // ============ 导入 / 导出 ============

  /** 导出 schema JSON 文本（可直接落库/存文件） */
  exportSchema(): string {
    return JSON.stringify(this.store.getState(), null, 2);
  }

  /** 导入 schema JSON（走迁移器，fail-fast）；成功后清空撤销栈 */
  loadSchema(json: string): BiDashboardSchema {
    const parsed = migrateSchema(JSON.parse(json));
    this.undoStack = [];
    this.redoStack = [];
    this.selectedChartId = null;
    this.store.set(parsed);
    return parsed;
  }

  replaceSchema(schema: Partial<BiDashboardSchema>) {
    this.undoStack = [];
    this.redoStack = [];
    this.selectedChartId = null;
    this.store.set(normalizeSchema(schema));
  }
}
