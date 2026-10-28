<template>
  <div ref="rootRef" class="bi-dashboard" :style="{ height: layout.height + 'px' }">
    <div
      v-for="item in layout.items"
      :key="item.chart.id"
      :ref="(el) => setCardRef(item.chart.id, el)"
      class="bi-dashboard__card"
      :style="{
        left: item.left + 'px',
        top: item.top + 'px',
        width: item.width + 'px',
        height: item.height + 'px',
      }"
      @click="emit('chart-select', item.chart.id)"
    >
      <div v-if="item.chart.title || drillActive(item.chart.id)" class="bi-dashboard__card-head">
        <span class="bi-dashboard__card-title">{{ item.chart.title || drillActive(item.chart.id) }}</span>
        <span class="bi-dashboard__card-tools">
          <button
            v-if="drillActive(item.chart.id)"
            class="bi-dashboard__tool"
            :title="t('common.back')"
            @click.stop="drillUp(item.chart.id)"
          >
            ↩
          </button>
          <button
            v-if="item.chart.drill?.path?.length"
            class="bi-dashboard__tool bi-dashboard__tool--drill"
            :title="t('common.resetDrill')"
            @click.stop="drillReset(item.chart.id)"
          >
            ⤾
          </button>
          <button
            v-if="linkageHit(item.chart.id)"
            class="bi-dashboard__tool bi-dashboard__tool--linkage"
            :title="linkageHit(item.chart.id)?.value"
            @click.stop="clearLinkage(linkageHit(item.chart.id)!.datasetId)"
          >
            ◉
          </button>
          <button
            class="bi-dashboard__tool"
            :title="t('common.exportImage')"
            @click.stop="exportChart(item.chart.id)"
          >
            ⇩
          </button>
          <button
            class="bi-dashboard__tool"
            :title="t('common.fullscreen')"
            @click.stop="fullscreen(item.chart.id)"
          >
            ⛶
          </button>
        </span>
      </div>
      <div v-else class="bi-dashboard__card-head bi-dashboard__card-head--tools-only">
        <span class="bi-dashboard__card-tools">
          <button class="bi-dashboard__tool" :title="t('common.exportImage')" @click.stop="exportChart(item.chart.id)">⇩</button>
          <button class="bi-dashboard__tool" :title="t('common.fullscreen')" @click.stop="fullscreen(item.chart.id)">⛶</button>
        </span>
      </div>
      <div class="bi-dashboard__card-body">
        <BiChart
          :chart="effectiveChart(item.chart)"
          :rows="rowsForRender(item.chart).rows"
          :theme="theme"
          :error="rowsForRender(item.chart).error"
          :empty-text="emptyText"
          @chart-click="(e) => handleChartClick(e, item.chart)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 仪表盘渲染器（只读）：
 * - schema + resolvers → 网格布局图表（布局数学 bi-core layoutCharts）
 * - 跨图联动（schema.linkage.enabled）：点击带维度值的图表过滤同数据集的兄弟图表，
 *   点同值取消；联动命中的卡片亮 ◉，点它清掉该数据集的联动
 * - 下钻（chart.drill.path）：点击逐层深入，父层值作隐式过滤；↩ 回上一层，⤾ 重置
 * - 卡片工具：⇩ 导出 PNG（引擎 getDataURL）、⛶ 全屏（requestFullscreen）
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { applyFilters, defaultGrid, layoutCharts, resolveDatasetRows } from "@go-wind-ui/bi-core";
import type {
  BiChartEvent,
  BiChartSchema,
  BiDashboardSchema,
  BiDatasetData,
  BiRow,
} from "@go-wind-ui/bi-core";

import { applyBiLocaleFromEnv, useBiEnv, useBiI18n, useBiTheme } from "./env";
import BiChart from "./BiChart.vue";

const props = withDefaults(
  defineProps<{
    schema: Partial<BiDashboardSchema>;
  }>(),
  {}
);

const emit = defineEmits<{
  "chart-click": [event: BiChartEvent];
  "chart-select": [chartId: string];
  /** 联动过滤变化（宿主可同步状态） */
  "linkage-change": [info: { datasetId: string; field: string; value: string } | null];
}>();

applyBiLocaleFromEnv();
const env = useBiEnv();
const { t } = useBiI18n();
const theme = useBiTheme();

const rootRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
let observer: ResizeObserver | null = null;

onMounted(() => {
  if (!rootRef.value) return;
  observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width ?? 0;
    if (width > 0) containerWidth.value = width;
  });
  observer.observe(rootRef.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});

const emptyText = computed(() => t("common.noData"));

const cardRefs = new Map<string, HTMLElement>();
function setCardRef(id: string, el: unknown) {
  if (el) cardRefs.set(id, el as HTMLElement);
  else cardRefs.delete(id);
}

// ============ 数据解析 ============
const rowsMap = ref<Record<string, BiDatasetData>>({});

watch(
  () => [props.schema.datasets, env.resolvers] as const,
  async () => {
    const datasets = props.schema.datasets ?? [];
    const next: Record<string, BiDatasetData> = {};
    await Promise.all(
      datasets.map(async (ds) => {
        next[ds.id] = await resolveDatasetRows(ds, env.resolvers?.[ds.id]);
      })
    );
    rowsMap.value = next;
  },
  { immediate: true, deep: true }
);

function rowsFor(chart: { datasetId: string }): BiDatasetData {
  return rowsMap.value[chart.datasetId] ?? { rows: [], loading: false, error: null };
}

// ============ 跨图联动 ============
const linkageEnabled = computed(() => props.schema.linkage?.enabled === true);
/** datasetId → {field, value}（每数据集一个联动槽位） */
const linkageMap = reactive<Record<string, { field: string; value: string }>>({});

function linkageHit(chartId: string): { datasetId: string; field: string; value: string } | null {
  const chart = props.schema.charts?.find((c) => c.id === chartId);
  if (!chart) return null;
  const hit = linkageMap[chart.datasetId];
  return hit ? { datasetId: chart.datasetId, ...hit } : null;
}

function clearLinkage(datasetId: string) {
  delete linkageMap[datasetId];
  emit("linkage-change", null);
}

function clearAllLinkage() {
  Object.keys(linkageMap).forEach((k) => delete linkageMap[k]);
  emit("linkage-change", null);
}

function handleChartClick(event: BiChartEvent, chart: BiChartSchema) {
  emit("chart-click", event);
  if (chart.drill?.path?.length) {
    drillDown(chart, event);
    return;
  }
  if (!linkageEnabled.value) return;
  const dim = chart.encoding?.dimension;
  if (!dim || event.name === undefined) return;
  const existing = linkageMap[chart.datasetId];
  const same = existing && existing.field === dim && existing.value === String(event.name);
  if (same) {
    clearLinkage(chart.datasetId);
    return;
  }
  linkageMap[chart.datasetId] = { field: dim, value: String(event.name) };
  emit("linkage-change", { datasetId: chart.datasetId, field: dim, value: String(event.name) });
}

// ============ 下钻 ============
interface DrillState {
  level: number; // 当前处于 path 的第几层
  parents: { field: string; value: string }[]; // 祖先链（隐式过滤）
}
const drillStates = reactive<Record<string, DrillState>>({});

function drillActive(chartId: string): string | null {
  const st = drillStates[chartId];
  if (!st) return null;
  const chart = props.schema.charts?.find((c) => c.id === chartId);
  const label = chart?.drill?.path?.[st.level];
  return label ? String(label) : null;
}

function drillDown(chart: BiChartSchema, event: BiChartEvent) {
  const path = chart.drill?.path ?? [];
  const st = drillStates[chart.id] ?? { level: 0, parents: [] };
  if (st.level >= path.length - 1) return; // 已到最深层
  const field = path[st.level];
  drillStates[chart.id] = {
    level: st.level + 1,
    parents: [...st.parents, { field, value: String(event.name ?? "") }],
  };
}

function drillUp(chartId: string) {
  const st = drillStates[chartId];
  if (!st || st.level === 0) {
    delete drillStates[chartId];
    return;
  }
  drillStates[chartId] = { level: st.level - 1, parents: st.parents.slice(0, -1) };
}

function drillReset(chartId: string) {
  delete drillStates[chartId];
}

/** 应用下钻后的生效图表：dimension 换成当前层，祖先值并入 filters */
function effectiveChart(chart: BiChartSchema): BiChartSchema {
  const st = drillStates[chart.id];
  if (!st || !chart.drill?.path?.length) return chart;
  const path = chart.drill.path;
  const dim = path[Math.min(st.level, path.length - 1)];
  const extraFilters = st.parents.map((p) => ({
    field: p.field,
    op: "eq" as const,
    value: p.value,
  }));
  return {
    ...chart,
    encoding: { ...chart.encoding, dimension: dim },
    filters: [...(chart.filters ?? []), ...extraFilters],
  };
}

// ============ 行解析（联动过滤在 transformRows 前作用于数据集行） ============
function linkageFilteredRows(datasetId: string, rows: BiRow[]): BiRow[] {
  const hit = linkageMap[datasetId];
  if (!hit) return rows;
  return applyFilters(rows, [{ field: hit.field, op: "eq", value: hit.value }]);
}

// 渲染用的行（含联动过滤）：rowsFor 的包装
const renderRowsMap = computed<Record<string, BiDatasetData>>(() => {
  const out: Record<string, BiDatasetData> = {};
  for (const [id, data] of Object.entries(rowsMap.value)) {
    out[id] = { ...data, rows: linkageFilteredRows(id, data.rows) };
  }
  return out;
});
function rowsForRender(chart: { datasetId: string }): BiDatasetData {
  return renderRowsMap.value[chart.datasetId] ?? { rows: [], loading: false, error: null };
}

// ============ 布局 ============
const layout = computed(() =>
  layoutCharts(props.schema.charts ?? [], props.schema.grid, containerWidth.value)
);

// grid 变化时 root 高度由 layout.height 驱动；defaultGrid 兜底缺省
const gridResolved = computed(() => defaultGrid(props.schema.grid));

// ============ 卡片工具 ============
function exportChart(chartId: string) {
  const item = layout.value.items.find((it) => it.chart.id === chartId);
  const chart = item?.chart;
  if (!chart) return;
  const effective = effectiveChart(chart);
  const engine = (window as any).__biChartHandles?.get?.(chartId);
  // 引擎句柄由 BiChart 暴露：走 DOM 查询兜底（canvas → dataURL 由引擎提供）
  const host = cardRefs.get(chartId)?.querySelector(".bi-chart__host");
  const canvas = host?.querySelector("canvas");
  if (!canvas) return;
  const url = canvasToPng(canvas);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${effective.title ?? chartId}.png`;
  a.click();
}

function canvasToPng(canvas: HTMLCanvasElement): string {
  // 复制到白底画布（echarts canvas 默认透明）
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  return out.toDataURL("image/png");
}

function fullscreen(chartId: string) {
  const el = cardRefs.get(chartId);
  if (!el) return;
  if (document.fullscreenElement) {
    void document.exitFullscreen?.();
    return;
  }
  void el.requestFullscreen?.()?.catch((err: unknown) => {
    console.error("[bi] fullscreen failed", err);
  });
}

/** 重新拉取全部 api 数据集（宿主轮询/刷新入口） */
async function refresh() {
  const datasets = props.schema.datasets ?? [];
  const next: Record<string, BiDatasetData> = { ...rowsMap.value };
  await Promise.all(
    datasets.map(async (ds) => {
      next[ds.id] = await resolveDatasetRows(ds, env.resolvers?.[ds.id]);
    })
  );
  rowsMap.value = next;
}

defineExpose({
  refresh,
  gridResolved,
  clearAllLinkage,
});
</script>


<style scoped>
.bi-dashboard {
  position: relative;
  width: 100%;
}

.bi-dashboard__card {
  position: absolute;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 10px 12px;
  overflow: hidden;
  background: var(--el-bg-color, #ffffff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
}

.bi-dashboard__card:fullscreen {
  padding: 20px;
  border-radius: 0;
  background: var(--el-bg-color, #fff);
}

.bi-dashboard__card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-bottom: 4px;
  min-height: 20px;
}

.bi-dashboard__card-head--tools-only {
  position: absolute;
  top: 8px;
  right: 10px;
  margin: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.bi-dashboard__card:hover .bi-dashboard__card-head--tools-only {
  opacity: 1;
}

.bi-dashboard__card-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bi-dashboard__card-tools {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.bi-dashboard__tool {
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary, #9ca3af);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bi-dashboard__tool:hover {
  color: var(--el-color-primary, #409eff);
  background: var(--el-fill-color, #f0f2f5);
}

.bi-dashboard__tool--linkage {
  color: var(--el-color-warning, #e6a23c);
}

.bi-dashboard__card-body {
  flex: 1;
  min-height: 0;
}
</style>
