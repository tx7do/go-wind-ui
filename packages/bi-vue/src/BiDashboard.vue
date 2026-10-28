<template>
  <div ref="rootRef" class="bi-dashboard" :style="{ height: layout.height + 'px' }">
    <div
      v-for="item in layout.items"
      :key="item.chart.id"
      class="bi-dashboard__card"
      :style="{
        left: item.left + 'px',
        top: item.top + 'px',
        width: item.width + 'px',
        height: item.height + 'px',
      }"
      @click="emit('chart-select', item.chart.id)"
    >
      <div v-if="item.chart.title" class="bi-dashboard__card-title">{{ item.chart.title }}</div>
      <div class="bi-dashboard__card-body">
        <BiChart
          :chart="item.chart"
          :rows="rowsFor(item.chart).rows"
          :theme="theme"
          :error="rowsFor(item.chart).error"
          :empty-text="emptyText"
          @chart-click="(e) => emit('chart-click', e)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 仪表盘渲染器（只读）：schema + resolvers → 网格布局图表。
 * 布局数学来自 bi-core 的 layoutCharts（与设计器画布同源）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { defaultGrid, layoutCharts, resolveDatasetRows } from "@go-wind-ui/bi-core";
import type { BiChartEvent, BiDashboardSchema, BiDatasetData } from "@go-wind-ui/bi-core";

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

// ============ 布局 ============
const layout = computed(() =>
  layoutCharts(props.schema.charts ?? [], props.schema.grid, containerWidth.value)
);

// grid 变化时 root 高度由 layout.height 驱动；defaultGrid 兜底缺省
const gridResolved = computed(() => defaultGrid(props.schema.grid));

defineExpose({ refresh, gridResolved });
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

.bi-dashboard__card-title {
  flex-shrink: 0;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bi-dashboard__card-body {
  flex: 1;
  min-height: 0;
}
</style>
