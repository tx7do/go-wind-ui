<template>
  <div class="bi-designer">
    <!-- ===== 工具栏 ===== -->
    <div class="bi-designer__toolbar">
      <div class="bi-designer__toolbar-group">
        <button class="bd-btn bd-btn--primary" :disabled="preview" @click="handleAddChart">
          + {{ t("designer.addChart") }}
        </button>
        <button class="bd-btn" :disabled="preview || !selectedId" :title="t('designer.duplicate')" @click="handleDuplicate">
          ⧉
        </button>
        <button class="bd-btn" :disabled="preview || !api.hasClipboard" :title="t('designer.paste')" @click="handlePaste">
          ⎘
        </button>
        <button
          class="bd-btn"
          :title="t('designer.undo')"
          :disabled="!api.canUndo || preview"
          @click="api.undo()"
        >
          ↩
        </button>
        <button
          class="bd-btn"
          :title="t('designer.redo')"
          :disabled="!api.canRedo || preview"
          @click="api.redo()"
        >
          ↪
        </button>
        <button class="bd-btn" :disabled="preview" @click="api.compact()">
          {{ t("designer.compact") }}
        </button>
        <div class="bi-designer__tpl-wrap">
          <button class="bd-btn" :disabled="preview" @click="templateOpen = !templateOpen">
            {{ t("designer.templates") }}
          </button>
          <div v-if="templateOpen" class="bi-designer__tpl-menu">
            <button
              v-for="tpl in templates"
              :key="tpl.key"
              class="bi-designer__tpl-item"
              :title="tpl.description"
              @click="applyTemplate(tpl.key)"
            >
              {{ tpl.name }}
            </button>
          </div>
        </div>
        <button
          class="bd-btn"
          :class="{ 'bd-btn--active-on': state.linkage?.enabled }"
          :disabled="preview"
          :title="t('designer.linkageTip')"
          @click="toggleLinkage"
        >
          {{ t("designer.linkage") }}
        </button>
        <select
          class="bd-input bi-designer__theme-select"
          :value="state.theme?.key ?? 'auto'"
          :disabled="preview"
          :title="t('designer.themePreset')"
          @change="setThemePreset(($event.target as HTMLSelectElement).value)"
        >
          <option value="auto">{{ t("designer.themeAuto") }}</option>
          <option v-for="preset in themePresets" :key="preset.key" :value="preset.key">
            {{ preset.name }}
          </option>
        </select>
      </div>
      <div class="bi-designer__toolbar-group">
        <button class="bd-btn" :disabled="!stateCharts.length" @click="handleExport">
          {{ t("designer.export") }}
        </button>
        <button class="bd-btn" :disabled="preview" @click="importInputRef?.click()">
          {{ t("designer.import") }}
        </button>
        <input
          ref="importInputRef"
          type="file"
          accept="application/json,.json"
          class="bi-designer__hidden-input"
          @change="handleImport"
        />
        <button class="bd-btn" @click="preview = !preview">
          {{ preview ? t("designer.edit") : t("designer.preview") }}
        </button>
      </div>
    </div>

    <div class="bi-designer__body">
      <!-- ===== 数据集面板 ===== -->
      <aside v-if="!preview" class="bi-designer__panel bi-designer__panel--left">
        <div class="bi-designer__panel-title">{{ t("designer.datasets") }}</div>

        <!-- 新增数据集表单 -->
        <div v-if="dsFormOpen" class="bi-designer__form">
          <label class="bi-designer__field">
            <span>{{ t("designer.datasetName") }}</span>
            <input v-model="dsForm.name" type="text" class="bd-input" />
          </label>
          <label class="bi-designer__field">
            <span>{{ t("designer.datasetType") }}</span>
            <select v-model="dsForm.type" class="bd-input">
              <option value="static">{{ t("designer.typeStatic") }}</option>
              <option value="api">{{ t("designer.typeApi") }}</option>
            </select>
          </label>
          <label v-if="dsForm.type === 'static'" class="bi-designer__field">
            <span>{{ t("designer.rowsJson") }}</span>
            <textarea v-model="dsForm.rows" class="bd-input bd-input--area" rows="6" />
          </label>
          <label v-else class="bi-designer__field">
            <span>{{ t("designer.apiParams") }}</span>
            <textarea v-model="dsForm.apiParams" class="bd-input bd-input--area" rows="3" />
          </label>
          <div v-if="dsFormError" class="bi-designer__form-error">{{ dsFormError }}</div>
          <div class="bi-designer__form-actions">
            <button class="bd-btn" @click="dsFormOpen = false">{{ t("designer.cancel") }}</button>
            <button class="bd-btn bd-btn--primary" @click="handleSaveDataset">
              {{ t("designer.save") }}
            </button>
          </div>
        </div>

        <!-- 数据集列表 -->
        <ul class="bi-designer__ds-list">
          <li v-for="ds in state.datasets" :key="ds.id" class="bi-designer__ds-item">
            <div class="bi-designer__ds-main">
              <span class="bi-designer__ds-name" :title="ds.id">{{ ds.name }}</span>
              <span class="bi-designer__ds-tag" :class="`bi-designer__ds-tag--${ds.type}`">
                {{ ds.type === "static" ? t("designer.typeStatic") : t("designer.typeApi") }}
              </span>
            </div>
            <span class="bi-designer__ds-meta">
              {{ columnsOf(ds.id).length }} {{ t("designer.columns") }}
            </span>
            <button
              class="bi-designer__ds-delete"
              :title="t('designer.delete')"
              @click="api.removeDataset(ds.id)"
            >
              ×
            </button>
          </li>
        </ul>
        <button class="bd-btn bd-btn--block" :disabled="dsFormOpen" @click="openDatasetForm">
          + {{ t("designer.addDataset") }}
        </button>
      </aside>

      <!-- ===== 画布 ===== -->
      <main class="bi-designer__canvas-wrap">
        <div
          ref="canvasRef"
          class="bi-designer__canvas"
          :style="{ height: canvasHeight + 'px', ...canvasChromeVars }"
          @pointerdown.self="api.select(null)"
        >
          <div
            v-for="item in canvasItems"
            :key="item.chart.id"
            class="bi-designer__card"
            :class="{
              'bi-designer__card--selected': selectedId === item.chart.id && !preview,
              'bi-designer__card--dragging': dragState?.id === item.chart.id,
            }"
            :style="cardStyle(item)"
            @pointerdown.stop="!preview && api.select(item.chart.id)"
          >
            <!-- 拖拽把手（标题区） -->
            <div
              v-if="!preview"
              class="bi-designer__card-head"
              @pointerdown.stop="startDrag($event, item, 'move')"
            >
              <span class="bi-designer__card-drag">⠿</span>
              <span class="bi-designer__card-title">{{
                item.chart.title || t(`types.${item.chart.type}`)
              }}</span>
              <button
                class="bi-designer__card-delete"
                :title="t('designer.delete')"
                @pointerdown.stop
                @click.stop="api.removeChart(item.chart.id)"
              >
                ×
              </button>
            </div>
            <div
              v-else-if="item.chart.title"
              class="bi-designer__card-head bi-designer__card-head--static"
            >
              <span class="bi-designer__card-title">{{ item.chart.title }}</span>
            </div>

            <div class="bi-designer__card-body">
              <BiChart
                :chart="item.chart"
                :rows="rowsFor(item.chart).rows"
                :theme="canvasTheme"
                :error="rowsFor(item.chart).error"
                :empty-text="t('common.noData')"
              />
            </div>

            <!-- 缩放把手 -->
            <span
              v-if="!preview"
              class="bi-designer__card-resize"
              @pointerdown.stop="startDrag($event, item, 'resize')"
            />
          </div>

          <div v-if="!stateCharts.length" class="bi-designer__canvas-empty">
            {{ t("designer.addChart") }}
          </div>
        </div>
      </main>

      <!-- ===== 属性面板（三 tab） ===== -->
      <aside v-if="!preview" class="bi-designer__panel bi-designer__panel--right">
        <template v-if="selected">
          <div class="bi-designer__tabs">
            <button
              v-for="tab in ['data', 'style', 'layout'] as const"
              :key="tab"
              class="bi-designer__tab"
              :class="{ 'bi-designer__tab--active': propTab === tab }"
              @click="propTab = tab"
            >
              {{ t(`designer.tab${tab[0]!.toUpperCase() + tab.slice(1)}`) }}
            </button>
          </div>

          <!-- ===== 数据 tab ===== -->
          <template v-if="propTab === 'data'">
            <label class="bi-designer__field">
              <span>{{ t("designer.title") }}</span>
              <input
                type="text"
                class="bd-input"
                :value="selected.title ?? ''"
                @change="
                  patchSelected({ title: ($event.target as HTMLInputElement).value || undefined })
                "
              />
            </label>

            <div class="bi-designer__field">
              <span>{{ t("designer.type") }}</span>
              <div class="bi-designer__type-grid">
                <button
                  v-for="tp in chartTypes"
                  :key="tp"
                  class="bi-designer__type-btn"
                  :class="{ 'bi-designer__type-btn--active': selected.type === tp }"
                  @click="patchSelected({ type: tp })"
                >
                  {{ t(`types.${tp}`) }}
                </button>
              </div>
            </div>

            <label class="bi-designer__field">
              <span>{{ t("designer.dataset") }}</span>
              <select
                class="bd-input"
                :value="selected.datasetId"
                @change="patchSelected({ datasetId: ($event.target as HTMLSelectElement).value })"
              >
                <option v-for="ds in state.datasets" :key="ds.id" :value="ds.id">
                  {{ ds.name }}
                </option>
              </select>
            </label>

            <label v-if="needsField(selected.type, 'dimension')" class="bi-designer__field">
              <span>{{ t("designer.dimension") }}</span>
              <select
                class="bd-input"
                :value="selected.encoding?.dimension ?? ''"
                @change="patchEncoding('dimension', ($event.target as HTMLSelectElement).value)"
              >
                <option value="">—</option>
                <option v-for="col in columnsOf(selected.datasetId)" :key="col" :value="col">
                  {{ `${col}（${fieldTypeName(selected.datasetId, col)}）` }}
                </option>
              </select>
            </label>

            <!-- 下钻路径 -->
            <div v-if="needsField(selected.type, 'dimension')" class="bi-designer__field">
              <span>{{ t("designer.drillPath") }}</span>
              <div v-if="selected.drill?.path?.length" class="bi-designer__drill-list">
                <span v-for="(col, i) in selected.drill.path" :key="i" class="bi-designer__drill-chip">
                  {{ i + 1 }}. {{ col }}
                  <button class="bi-designer__drill-del" @click="removeDrillLevel(i)">×</button>
                </span>
              </div>
              <select
                v-if="drillCandidates(selected).length"
                class="bd-input"
                value=""
                @change="
                  addDrillLevel(($event.target as HTMLSelectElement).value);
                  ($event.target as HTMLSelectElement).value = '';
                "
              >
                <option value="" disabled>{{ t("designer.addDrillLevel") }}</option>
                <option v-for="col in drillCandidates(selected)" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>

            <!-- 多度量（宽表，仅柱/线/面） -->
            <div v-if="showMeasures(selected.type)" class="bi-designer__field">
              <span>{{ t("designer.measures") }}</span>
              <div class="bi-designer__check-group">
                <label
                  v-for="col in numericCols(selected.datasetId)"
                  :key="col"
                  class="bi-designer__check"
                >
                  <input
                    type="checkbox"
                    :checked="(selected.encoding?.measures ?? []).includes(col)"
                    @change="toggleMeasure(col)"
                  />
                  <span>{{ col }}</span>
                </label>
                <span v-if="!numericCols(selected.datasetId).length" class="bi-designer__hint">—</span>
              </div>
            </div>

            <label
              v-if="needsField(selected.type, 'measure') && !usesWideMeasures"
              class="bi-designer__field"
            >
              <span>{{ t("designer.measure") }}</span>
              <select
                class="bd-input"
                :value="selected.encoding?.measure ?? ''"
                @change="patchEncoding('measure', ($event.target as HTMLSelectElement).value)"
              >
                <option value="">—</option>
                <option v-for="col in columnsOf(selected.datasetId)" :key="col" :value="col">
                  {{ col }}
                </option>
              </select>
            </label>

            <label v-if="showAgg(selected.type)" class="bi-designer__field">
              <span>{{ t("designer.aggregation") }}</span>
              <select
                class="bd-input"
                :value="selected.aggregation ?? 'sum'"
                @change="patchSelected({ aggregation: ($event.target as HTMLSelectElement).value as any })"
              >
                <option value="sum">{{ t("designer.aggSum") }}</option>
                <option value="avg">{{ t("designer.aggAvg") }}</option>
                <option value="count">{{ t("designer.aggCount") }}</option>
                <option value="max">{{ t("designer.aggMax") }}</option>
                <option value="min">{{ t("designer.aggMin") }}</option>
                <option value="none">{{ t("designer.aggNone") }}</option>
              </select>
            </label>

            <label
              v-if="needsField(selected.type, 'series') && !usesWideMeasures"
              class="bi-designer__field"
            >
              <span>{{ t("designer.series") }}</span>
              <select
                class="bd-input"
                :value="selected.encoding?.series ?? ''"
                @change="patchEncoding('series', ($event.target as HTMLSelectElement).value)"
              >
                <option value="">—</option>
                <option v-for="col in columnsOf(selected.datasetId)" :key="col" :value="col">
                  {{ col }}
                </option>
              </select>
            </label>

            <!-- 排序 -->
            <div v-if="needsField(selected.type, 'dimension')" class="bi-designer__field">
              <span>{{ t("designer.sortLabel") }}</span>
              <div class="bi-designer__row3">
                <select
                  class="bd-input"
                  :value="selected.sort?.by ?? 'dimension'"
                  @change="patchSort({ by: ($event.target as HTMLSelectElement).value as any })"
                >
                  <option value="dimension">{{ t("designer.sortByDim") }}</option>
                  <option value="measure">{{ t("designer.sortByMeasure") }}</option>
                </select>
                <select
                  class="bd-input"
                  :value="selected.sort?.order ?? 'asc'"
                  @change="patchSort({ order: ($event.target as HTMLSelectElement).value as any })"
                >
                  <option value="asc">{{ t("designer.asc") }}</option>
                  <option value="desc">{{ t("designer.desc") }}</option>
                </select>
                <input
                  type="number"
                  class="bd-input"
                  :value="selected.sort?.topN ?? ''"
                  min="1"
                  :placeholder="t('designer.topN')"
                  @change="
                    patchSort({
                      topN: ($event.target as HTMLInputElement).value
                        ? Number(($event.target as HTMLInputElement).value)
                        : undefined,
                    })
                  "
                />
              </div>
            </div>

            <!-- 过滤器 -->
            <div class="bi-designer__field">
              <span>{{ t("designer.filters") }}</span>
              <div
                v-for="(f, i) in selected.filters ?? []"
                :key="i"
                class="bi-designer__filter-row"
              >
                <select
                  class="bd-input"
                  :value="f.field"
                  @change="updateFilter(i, { field: ($event.target as HTMLSelectElement).value })"
                >
                  <option v-for="col in columnsOf(selected.datasetId)" :key="col" :value="col">
                    {{ col }}
                  </option>
                </select>
                <select
                  class="bd-input bi-designer__filter-op"
                  :value="f.op"
                  @change="updateFilter(i, { op: ($event.target as HTMLSelectElement).value as any })"
                >
                  <option value="eq">{{ t("designer.opEq") }}</option>
                  <option value="ne">{{ t("designer.opNe") }}</option>
                  <option value="gt">{{ t("designer.opGt") }}</option>
                  <option value="gte">{{ t("designer.opGte") }}</option>
                  <option value="lt">{{ t("designer.opLt") }}</option>
                  <option value="lte">{{ t("designer.opLte") }}</option>
                  <option value="contains">{{ t("designer.opContains") }}</option>
                  <option value="in">{{ t("designer.opIn") }}</option>
                </select>
                <input
                  type="text"
                  class="bd-input"
                  :value="Array.isArray(f.value) ? f.value.join(',') : String(f.value ?? '')"
                  @change="
                    updateFilter(
                      i,
                      { value: ($event.target as HTMLInputElement).value }
                    )
                  "
                />
                <button class="bi-designer__filter-del" @click="removeFilter(i)">×</button>
              </div>
              <button class="bd-btn bd-btn--block" @click="addFilter">
                {{ t("designer.addFilter") }}
              </button>
            </div>
          </template>

          <!-- ===== 样式 tab ===== -->
          <template v-else-if="propTab === 'style'">
            <label class="bi-designer__check-row">
              <input
                type="checkbox"
                :checked="selected.style?.showLegend"
                @change="patchStyle({ showLegend: ($event.target as HTMLInputElement).checked })"
              />
              <span>{{ t("designer.showLegend") }}</span>
            </label>
            <label class="bi-designer__check-row">
              <input
                type="checkbox"
                :checked="selected.style?.showLabel"
                @change="patchStyle({ showLabel: ($event.target as HTMLInputElement).checked })"
              />
              <span>{{ t("designer.showLabel") }}</span>
            </label>
            <label v-if="selected.type === 'bar'" class="bi-designer__check-row">
              <input
                type="checkbox"
                :checked="selected.style?.stack"
                @change="patchStyle({ stack: ($event.target as HTMLInputElement).checked })"
              />
              <span>{{ t("designer.stack") }}</span>
            </label>
            <label v-if="isCartesian(selected.type)" class="bi-designer__check-row">
              <input
                type="checkbox"
                :checked="selected.style?.dataZoom"
                @change="patchStyle({ dataZoom: ($event.target as HTMLInputElement).checked })"
              />
              <span>{{ t("designer.dataZoom") }}</span>
            </label>

            <label class="bi-designer__field">
              <span>{{ t("designer.palette") }}</span>
              <select
                class="bd-input"
                :value="selected.style?.palette ?? ''"
                @change="
                  patchStyle({ palette: ($event.target as HTMLSelectElement).value || undefined })
                "
              >
                <option value="">{{ t("designer.paletteDefault") }}</option>
                <option v-for="key in paletteKeys" :key="key" :value="key">
                  {{ t(`designer.palette${key[0]!.toUpperCase() + key.slice(1)}`) }}
                </option>
              </select>
            </label>

            <div class="bi-designer__panel-section">{{ t("designer.numberFormat") }}</div>
            <label class="bi-designer__field">
              <span>{{ t("designer.decimals") }}</span>
              <input
                type="number"
                class="bd-input"
                min="0"
                max="6"
                :value="selected.style?.format?.decimals ?? ''"
                @change="
                  patchFormat({
                    decimals: ($event.target as HTMLInputElement).value
                      ? Number(($event.target as HTMLInputElement).value)
                      : undefined,
                  })
                "
              />
            </label>
            <label class="bi-designer__check-row">
              <input
                type="checkbox"
                :checked="selected.style?.format?.thousand"
                @change="patchFormat({ thousand: ($event.target as HTMLInputElement).checked })"
              />
              <span>{{ t("designer.thousand") }}</span>
            </label>
            <div class="bi-designer__num-row">
              <input
                type="text"
                class="bd-input"
                :placeholder="t('designer.prefix')"
                :value="selected.style?.format?.prefix ?? ''"
                @change="
                  patchFormat({
                    prefix: ($event.target as HTMLInputElement).value || undefined,
                  })
                "
              />
              <input
                type="text"
                class="bd-input"
                :placeholder="t('designer.suffix')"
                :value="selected.style?.format?.suffix ?? ''"
                @change="
                  patchFormat({
                    suffix: ($event.target as HTMLInputElement).value || undefined,
                  })
                "
              />
            </div>
          </template>

          <!-- ===== 布局 tab ===== -->
          <template v-else>
            <div class="bi-designer__panel-section">{{ t("designer.position") }}</div>
            <div class="bi-designer__num-row">
              <input
                type="number"
                class="bd-input"
                :value="selected.x ?? 0"
                min="0"
                @change="
                  api.moveChart(
                    selected.id,
                    Number(($event.target as HTMLInputElement).value),
                    selected.y ?? 0
                  )
                "
              />
              <input
                type="number"
                class="bd-input"
                :value="selected.y ?? 0"
                min="0"
                @change="
                  api.moveChart(
                    selected.id,
                    selected.x ?? 0,
                    Number(($event.target as HTMLInputElement).value)
                  )
                "
              />
            </div>
            <div class="bi-designer__panel-section">{{ t("designer.size") }}</div>
            <div class="bi-designer__num-row">
              <input
                type="number"
                class="bd-input"
                :value="selected.w ?? 6"
                min="1"
                @change="
                  api.resizeChart(
                    selected.id,
                    Number(($event.target as HTMLInputElement).value),
                    selected.h ?? 4
                  )
                "
              />
              <input
                type="number"
                class="bd-input"
                :value="selected.h ?? 4"
                min="1"
                @change="
                  api.resizeChart(
                    selected.id,
                    selected.w ?? 6,
                    Number(($event.target as HTMLInputElement).value)
                  )
                "
              />
            </div>
            <button class="bd-btn bd-btn--block" :disabled="!selectedId" @click="handleDuplicate">
              {{ t("designer.duplicate") }}
            </button>
            <button
              class="bd-btn bd-btn--danger bd-btn--block"
              @click="api.removeChart(selected.id)"
            >
              {{ t("designer.delete") }}
            </button>
          </template>
        </template>
        <div v-else class="bi-designer__empty-tip">{{ t("designer.selectChart") }}</div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * BI 设计器（M3 深化）：
 * - 数据集面板（static 内嵌 JSON / api 声明）
 * - 画布：指针拖拽移动 + 右下角缩放（栅格吸附 + 碰撞推挤），与渲染器同源布局数学
 * - 属性面板三 tab：
 *   数据（图型网格 / 数据集 / 维度 / 多度量 / 度量 / 聚合 / 系列 / 排序 TopN / 过滤器）
 *   样式（图例 / 标签 / 堆叠 / 数据缩放 / 色盘 / 数字格式）
 *   布局（位置尺寸 / 复制 / 删除）
 * - 撤销重做、复制粘贴（Ctrl+C/V/D）、删除（Del）、全选清除（Esc）快捷键
 * 状态机在 bi-core 的 BiDesignerApi；数据变换（过滤→聚合→排序）也在 core，
 * 渲染器与画布共享同一条管线。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from "vue";
import {
  BiDesignerApi,
  BI_DASHBOARD_THEMES,
  BI_PALETTE_KEYS,
  BI_TEMPLATES,
  getDashboardThemePreset,
  resolveDashboardTheme,
  defaultGrid,
  getChartTypes,
  getColumns,
  inferFieldType,
  layoutCharts,
  resolveDatasetRows,
} from "@go-wind-ui/bi-core";
import type {
  BiChartFilter,
  BiChartSchema,
  BiChartType,
  BiDashboardSchema,
  BiDatasetData,
  BiPlacedChart,
} from "@go-wind-ui/bi-core";

import { applyBiLocaleFromEnv, useBiEnv, useBiI18n, useBiTheme } from "./env";
import BiChart from "./BiChart.vue";

const props = withDefaults(
  defineProps<{
    initialSchema?: Partial<BiDashboardSchema>;
    /** 缺省演示 schema（无 initialSchema 时使用，方便快速上手） */
    demo?: boolean;
  }>(),
  { demo: false }
);

const emit = defineEmits<{
  /** 任意提交后抛出最新 schema（宿主保存用） */
  change: [schema: BiDashboardSchema];
}>();

// ============ 演示 schema（置于最前：api 初始化要用） ============
const DEMO_SCHEMA: Partial<BiDashboardSchema> = {
  name: "demo",
  datasets: [
    {
      id: "ds_month",
      name: "月度汇总",
      type: "static",
      rows: Array.from({ length: 12 }, (_, i) => ({
        month: `${i + 1}月`,
        sales: Math.round(80 + Math.sin(i / 2) * 60 + i * 8),
        target: 160,
      })),
    },
    {
      id: "ds_orders",
      name: "订单明细（可聚合）",
      type: "static",
      rows: Array.from({ length: 48 }, (_, i) => ({
        city: ["北京", "上海", "广州", "深圳", "杭州", "成都"][i % 6],
        category: ["硬件", "软件", "服务"][i % 3],
        amount: Math.round(50 + Math.random() * 450),
      })),
    },
    {
      id: "ds_channel",
      name: "渠道分布",
      type: "static",
      rows: [
        { channel: "直销", amount: 420 },
        { channel: "渠道A", amount: 300 },
        { channel: "渠道B", amount: 180 },
        { channel: "线上", amount: 260 },
      ],
    },
    {
      id: "ds_kpi",
      name: "完成率",
      type: "static",
      rows: [{ value: 76 }],
    },
  ],
  charts: [
    {
      id: "demo_bar",
      title: "城市订单（求和聚合）",
      datasetId: "ds_orders",
      type: "bar",
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      encoding: { dimension: "city", measure: "amount" },
      aggregation: "sum",
      sort: { by: "measure", order: "desc", topN: 6 },
    },
    {
      id: "demo_wide",
      title: "销售 vs 目标（宽度量）",
      datasetId: "ds_month",
      type: "bar",
      x: 6,
      y: 0,
      w: 6,
      h: 4,
      encoding: { dimension: "month", measures: ["sales", "target"] },
      style: { showLegend: true },
    },
    {
      id: "demo_pie",
      title: "品类占比（含过滤器）",
      datasetId: "ds_orders",
      type: "donut",
      x: 0,
      y: 4,
      w: 6,
      h: 4,
      encoding: { dimension: "category", measure: "amount" },
      aggregation: "sum",
      filters: [{ field: "city", op: "ne", value: "成都" }],
    },
    {
      id: "demo_gauge",
      title: "完成率",
      datasetId: "ds_kpi",
      type: "gauge",
      x: 6,
      y: 4,
      w: 6,
      h: 4,
      encoding: { measure: "value" },
    },
  ],
};

applyBiLocaleFromEnv();
const env = useBiEnv();
const { t } = useBiI18n();
const theme = useBiTheme();

const api = new BiDesignerApi(props.initialSchema ?? (props.demo ? DEMO_SCHEMA : {}));
const state = shallowRef<BiDashboardSchema>(api.getSnapshot());
api.subscribe(() => {
  state.value = api.getSnapshot();
  emit("change", api.getSnapshot());
});

const preview = ref(false);
const importInputRef = ref<HTMLInputElement | null>(null);
// 图型网格来自注册表（引擎适配器包可扩展，如 s2/g6）
const chartTypes = getChartTypes();
const templates = BI_TEMPLATES;
const templateOpen = ref(false);

function applyTemplate(key: string) {
  const tpl = templates.find((tp) => tp.key === key);
  if (!tpl) return;
  api.replaceSchema(tpl.schema);
  templateOpen.value = false;
}

const themePresets = Object.values(BI_DASHBOARD_THEMES);

/** 画布 chrome：预设命中时把 --bi-* 变量注到画布容器（卡片 chrome 全走变量链） */
const canvasChromeVars = computed(() => {
  const preset = getDashboardThemePreset(state.value.theme?.key);
  if (!preset) return {};
  const vars: Record<string, string> = {
    "--bi-card-bg": preset.cardBg ?? "",
    "--bi-card-border": preset.cardBorder ?? "",
    "--bi-card-text": preset.cardTitle ?? "",
  };
  if (preset.canvasBg) vars["--bi-canvas-bg"] = preset.canvasBg;
  return vars;
});

/** 画布内图表主题：预设钉死（mode/palette），否则跟随宿主亮暗（theme 即 useBiTheme 结果） */
const canvasTheme = computed(() => resolveDashboardTheme(state.value.theme?.key, theme.value.mode === "dark").theme);

/** 主题预设（dashboard.theme.key；auto = 跟随宿主亮暗） */
function setThemePreset(key: string) {
  const next = { ...state.value };
  if (key === "auto") next.theme = undefined;
  else next.theme = { key };
  api.replaceSchema(next);
}

/** 联动开关（dashboard.linkage.enabled） */
function toggleLinkage() {
  const enabled = !(state.value.linkage?.enabled === true);
  // 直接经 commit 路径之外的全量替换：linkage 是页面级配置
  const next = { ...state.value, linkage: { enabled } };
  api.replaceSchema(next);
}

/** 下钻路径编辑 */
function addDrillLevel(col: string) {
  if (!selected.value || !col) return;
  const path = [...(selected.value.drill?.path ?? []), col];
  patchSelected({ drill: { path } });
}

function removeDrillLevel(i: number) {
  if (!selected.value) return;
  const path = (selected.value.drill?.path ?? []).filter((_, idx) => idx !== i);
  patchSelected({ drill: path.length ? { path } : undefined });
}
const paletteKeys = BI_PALETTE_KEYS;
const propTab = ref<"data" | "style" | "layout">("data");

const stateCharts = computed(() => state.value.charts ?? []);
const selectedId = computed(() => {
  // 依赖 state 快照（api.selectedId 是类字段非响应式，需要借 state 触发重算）
  void state.value;
  return preview.value ? null : api.selectedId;
});
const selected = computed(() => stateCharts.value.find((c) => c.id === api.selectedId) ?? null);
/** 宽表多度量生效中（此时单度量/系列拆分被忽略） */
const usesWideMeasures = computed(() => (selected.value?.encoding?.measures?.length ?? 0) > 0);

// ============ 画布几何 ============
const canvasRef = ref<HTMLElement | null>(null);
const canvasWidth = ref(0);
let canvasObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!canvasRef.value) return;
  canvasObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width ?? 0;
    if (width > 0) canvasWidth.value = width;
  });
  canvasObserver.observe(canvasRef.value);
});

onBeforeUnmount(() => {
  canvasObserver?.disconnect();
  stopWindowDrag();
  window.removeEventListener("keydown", onKeyDown);
});

const grid = computed(() => defaultGrid(state.value.grid));

/** 流式补位后的画布条目（与渲染器同一 layoutCharts 数学） */
const canvasItems = computed<BiPlacedChart[]>(() =>
  layoutCharts(stateCharts.value, state.value.grid, canvasWidth.value).items
);

const canvasHeight = computed(() =>
  layoutCharts(stateCharts.value, state.value.grid, canvasWidth.value).height
);

function cardStyle(item: BiPlacedChart) {
  const drag = dragState.value?.id === item.chart.id ? dragState.value : null;
  const cols = grid.value.columns;
  const half = grid.value.gap / 2;
  const x = (item.x ?? 0) + (drag?.mode === "move" ? drag.dx : 0);
  const y = (item.y ?? 0) + (drag?.mode === "move" ? drag.dy : 0);
  const w = Math.max(1, (item.w ?? 6) + (drag?.mode === "resize" ? drag.dw : 0));
  const h = Math.max(1, (item.h ?? 4) + (drag?.mode === "resize" ? drag.dh : 0));
  const colWidth = canvasWidth.value / cols;
  return {
    left: x * colWidth + half + "px",
    top: y * grid.value.rowHeight + half + "px",
    width: w * colWidth - grid.value.gap + "px",
    height: h * grid.value.rowHeight - grid.value.gap + "px",
  };
}

// ============ 拖拽 / 缩放（指针事件 + 栅格吸附，提交时才进撤销栈） ============
interface DragState {
  id: string;
  mode: "move" | "resize";
  startClientX: number;
  startClientY: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

const dragState = ref<DragState | null>(null);

function startDrag(event: PointerEvent, item: BiPlacedChart, mode: "move" | "resize") {
  event.preventDefault();
  // 拖拽把手拦了冒泡，选中在这里补（拖哪选哪）
  api.select(item.chart.id);
  dragState.value = {
    id: item.chart.id,
    mode,
    startClientX: event.clientX,
    startClientY: event.clientY,
    dx: 0,
    dy: 0,
    dw: 0,
    dh: 0,
  };
  window.addEventListener("pointermove", onWindowDrag);
  window.addEventListener("pointerup", onWindowDragEnd);
}

function onWindowDrag(event: PointerEvent) {
  const drag = dragState.value;
  if (!drag) return;
  const colWidth = canvasWidth.value / grid.value.columns || 1;
  const gx = Math.round((event.clientX - drag.startClientX) / colWidth);
  const gy = Math.round((event.clientY - drag.startClientY) / grid.value.rowHeight);
  drag.dx = drag.mode === "move" ? gx : 0;
  drag.dy = drag.mode === "move" ? gy : 0;
  drag.dw = drag.mode === "resize" ? gx : 0;
  drag.dh = drag.mode === "resize" ? gy : 0;
}

function onWindowDragEnd() {
  const drag = dragState.value;
  dragState.value = null;
  stopWindowDrag();
  if (!drag) return;
  const item = canvasItems.value.find((it) => it.chart.id === drag.id);
  if (!item) return;
  if (drag.mode === "move") {
    if (drag.dx !== 0 || drag.dy !== 0) {
      api.moveChart(item.chart.id, (item.x ?? 0) + drag.dx, (item.y ?? 0) + drag.dy);
    }
  } else if (drag.dw !== 0 || drag.dh !== 0) {
    api.resizeChart(item.chart.id, (item.w ?? 6) + drag.dw, (item.h ?? 4) + drag.dh);
  }
}

function stopWindowDrag() {
  window.removeEventListener("pointermove", onWindowDrag);
  window.removeEventListener("pointerup", onWindowDragEnd);
}

// ============ 数据解析（画布预览用） ============
const rowsMap = ref<Record<string, BiDatasetData>>({});

watch(
  () => [state.value.datasets, env.resolvers] as const,
  async () => {
    const next: Record<string, BiDatasetData> = {};
    await Promise.all(
      state.value.datasets.map(async (ds) => {
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

function columnsOf(datasetId: string): string[] {
  return getColumns(rowsMap.value[datasetId]?.rows);
}

function numericCols(datasetId: string): string[] {
  const rows = rowsMap.value[datasetId]?.rows;
  return getColumns(rows).filter((c) => inferFieldType(rows, c) === "number");
}

function colType(datasetId: string, col: string): string {
  return inferFieldType(rowsMap.value[datasetId]?.rows, col);
}

/** 字段类型的 locale 键（inferFieldType 返回小写，locale 键为驼峰） */
function fieldTypeName(datasetId: string, col: string): string {
  const ft = colType(datasetId, col);
  return t(`designer.type${ft[0]!.toUpperCase() + ft.slice(1)}`);
}

// ============ 属性面板：数据 tab ============
function patchSelected(patch: Partial<BiChartSchema>) {
  if (!selected.value) return;
  api.updateChart(selected.value.id, patch);
}

function patchEncoding(key: "dimension" | "measure" | "series", value: string) {
  if (!selected.value) return;
  const encoding = { ...(selected.value.encoding ?? {}) };
  if (value) encoding[key] = value;
  else delete encoding[key];
  patchSelected({ encoding });
}

function toggleMeasure(col: string) {
  if (!selected.value) return;
  const measures = [...(selected.value.encoding?.measures ?? [])];
  const idx = measures.indexOf(col);
  if (idx >= 0) measures.splice(idx, 1);
  else measures.push(col);
  const encoding = { ...(selected.value.encoding ?? {}) };
  if (measures.length) {
    encoding.measures = measures;
    // 宽表与长表系列拆分互斥
    delete encoding.series;
  } else {
    delete encoding.measures;
  }
  patchSelected({ encoding });
}

function patchSort(patch: Partial<NonNullable<BiChartSchema["sort"]>>) {
  if (!selected.value) return;
  const sort = { by: "dimension" as const, order: "asc" as const, ...selected.value.sort, ...patch };
  // topN undefined 时移除键，避免序列化残留
  if (sort.topN === undefined) delete (sort as any).topN;
  patchSelected({ sort });
}

function addFilter() {
  if (!selected.value) return;
  const cols = columnsOf(selected.value.datasetId);
  const filters: BiChartFilter[] = [
    ...(selected.value.filters ?? []),
    { field: cols[0] ?? "", op: "eq", value: "" },
  ];
  patchSelected({ filters });
}

function updateFilter(i: number, patch: Partial<BiChartFilter>) {
  if (!selected.value) return;
  const filters = (selected.value.filters ?? []).map((f, idx) =>
    idx === i ? { ...f, ...patch } : f
  );
  patchSelected({ filters });
}

function removeFilter(i: number) {
  if (!selected.value) return;
  patchSelected({ filters: (selected.value.filters ?? []).filter((_, idx) => idx !== i) });
}

/** 各图型需要的编码字段 */
function needsField(type: BiChartType, field: "dimension" | "measure" | "series"): boolean {
  switch (field) {
    case "dimension":
      return type !== "gauge";
    case "measure":
      return true;
    case "series":
      return ["bar", "line", "area", "scatter", "radar"].includes(type);
  }
}

/** 下钻候选：未入路径的维度列（保持可扩展到层级表） */
function drillCandidates(chart: BiChartSchema): string[] {
  const used = new Set(chart.drill?.path ?? []);
  const dim = chart.encoding?.dimension;
  if (dim) used.add(dim);
  return columnsOf(chart.datasetId).filter((c) => !used.has(c));
}

function isCartesian(type: BiChartType): boolean {
  return ["bar", "line", "area", "scatter"].includes(type);
}

function showMeasures(type: BiChartType): boolean {
  return ["bar", "line", "area"].includes(type);
}

function showAgg(type: BiChartType): boolean {
  return ["bar", "line", "area", "pie", "donut", "radar"].includes(type);
}

// ============ 属性面板：样式 tab ============
function patchStyle(patch: Partial<NonNullable<BiChartSchema["style"]>>) {
  if (!selected.value) return;
  patchSelected({ style: { ...selected.value.style, ...patch } });
}

function patchFormat(patch: Partial<NonNullable<BiChartSchema["style"]>["format"]>) {
  if (!selected.value) return;
  const format = { ...selected.value.style?.format, ...patch };
  if (format.decimals === undefined) delete (format as any).decimals;
  if (!format.prefix) delete (format as any).prefix;
  if (!format.suffix) delete (format as any).suffix;
  patchSelected({ style: { ...selected.value.style, format } });
}

// ============ 数据集表单 ============
const dsFormOpen = ref(false);
const dsFormError = ref("");
const dsForm = reactive({
  name: "",
  type: "static" as "static" | "api",
  rows: `[
  { "month": "1月", "sales": 120 },
  { "month": "2月", "sales": 200 }
]`,
  apiParams: "{}",
});

function openDatasetForm() {
  dsForm.name = "";
  dsForm.type = "static";
  dsForm.rows = `[
  { "month": "1月", "sales": 120 },
  { "month": "2月", "sales": 200 }
]`;
  dsForm.apiParams = "{}";
  dsFormError.value = "";
  dsFormOpen.value = true;
}

function handleSaveDataset() {
  if (!dsForm.name.trim()) {
    dsFormError.value = t("designer.datasetName");
    return;
  }
  let rows: any[] | undefined;
  let apiParams: Record<string, unknown> | undefined;
  try {
    if (dsForm.type === "static") {
      rows = JSON.parse(dsForm.rows || "[]");
      if (!Array.isArray(rows)) throw new Error("not array");
    } else {
      apiParams = JSON.parse(dsForm.apiParams || "{}");
    }
  } catch {
    dsFormError.value = t("designer.invalidJson");
    return;
  }
  api.addDataset({
    name: dsForm.name.trim(),
    type: dsForm.type,
    rows,
    api: apiParams ? { params: apiParams } : undefined,
  });
  dsFormOpen.value = false;
}

// ============ 工具栏动作 ============
function handleAddChart() {
  api.addChart({ encoding: {} });
}

function handleDuplicate() {
  if (selectedId.value) api.duplicateChart(selectedId.value);
}

function handlePaste() {
  api.pasteChart();
}

function handleExport() {
  const blob = new Blob([api.exportSchema()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.value.name || "bi-dashboard"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      api.loadSchema(String(reader.result ?? ""));
    } catch (err) {
      // 原始错误带控制台，界面提示统一文案（不吞错）
      console.error("[bi-designer] import failed", err);
      window.alert(t("designer.importFailed"));
    }
  };
  reader.readAsText(file);
}

// ============ 键盘快捷键（输入控件聚焦时不拦截） ============
function onKeyDown(event: KeyboardEvent) {
  if (preview.value) return;
  const target = event.target as HTMLElement | null;
  const tag = target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  const mod = event.ctrlKey || event.metaKey;
  if (mod && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) api.redo();
    else api.undo();
  } else if (mod && event.key.toLowerCase() === "y") {
    event.preventDefault();
    api.redo();
  } else if (mod && event.key.toLowerCase() === "c") {
    if (selectedId.value) api.copyChart(selectedId.value);
  } else if (mod && event.key.toLowerCase() === "v") {
    api.pasteChart();
  } else if (mod && event.key.toLowerCase() === "d") {
    event.preventDefault();
    handleDuplicate();
  } else if (event.key === "Delete" || event.key === "Backspace") {
    if (selectedId.value) api.removeChart(selectedId.value);
  } else if (event.key === "Escape") {
    api.select(null);
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});
</script>

<style scoped>
/* 布局自足：不依赖宿主 Tailwind；颜色走 EP 变量 + 裸应用回退 */
.bi-designer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary, #1f2937);
}

.bi-designer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
}

.bi-designer__toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bi-designer__body {
  flex: 1;
  display: flex;
  gap: 8px;
  min-height: 0;
}

/* ===== 面板 ===== */
.bi-designer__panel {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow: auto;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
}

.bi-designer__panel--left {
  width: 240px;
}

.bi-designer__panel--right {
  width: 280px;
}

.bi-designer__panel-title {
  font-size: 13px;
  font-weight: 600;
}

.bi-designer__panel-section {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #6b7280);
}

.bi-designer__empty-tip {
  color: var(--el-text-color-secondary, #9ca3af);
  font-size: 12px;
  padding: 12px 0;
  text-align: center;
}

/* ===== 属性面板 tab ===== */
.bi-designer__tabs {
  display: flex;
  gap: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.bi-designer__tab {
  flex: 1;
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #6b7280);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bi-designer__tab:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}

.bi-designer__tab--active {
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  font-weight: 600;
}

/* ===== 图型选择网格 ===== */
.bi-designer__type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.bi-designer__type-btn {
  height: 26px;
  padding: 0 4px;
  font-size: 11px;
  color: var(--el-text-color-regular, #4b5563);
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bi-designer__type-btn:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
}

.bi-designer__type-btn--active {
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary, #409eff);
  font-weight: 600;
}

/* ===== 复选组（多度量） ===== */
.bi-designer__check-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.bi-designer__check,
.bi-designer__check-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-regular, #4b5563);
  cursor: pointer;
}

.bi-designer__check-row {
  padding: 2px 0;
}

.bi-designer__check input,
.bi-designer__check-row input {
  accent-color: var(--el-color-primary, #409eff);
  margin: 0;
}

.bi-designer__hint {
  color: var(--el-text-color-placeholder, #c0c4cc);
  font-size: 12px;
}

.bi-designer__col-type {
  float: right;
  font-size: 10px;
  color: var(--el-text-color-placeholder, #c0c4cc);
}

/* ===== 过滤器行 ===== */
.bi-designer__filter-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.bi-designer__filter-row .bd-input {
  min-width: 0;
  flex: 1;
}

.bi-designer__filter-op {
  flex: 0 0 auto !important;
  width: 68px;
}

.bi-designer__filter-del {
  flex-shrink: 0;
  width: 20px;
  height: 24px;
  padding: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary, #9ca3af);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bi-designer__filter-del:hover {
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}

/* ===== 三列排（排序） ===== */
.bi-designer__row3 {
  display: flex;
  gap: 4px;
}

.bi-designer__row3 .bd-input {
  min-width: 0;
}

/* ===== 表单 ===== */
.bi-designer__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #6b7280);
}

.bi-designer__num-row {
  display: flex;
  gap: 6px;
}

.bi-designer__num-row .bd-input {
  flex: 1;
  min-width: 0;
}

.bd-input {
  box-sizing: border-box;
  width: 100%;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--el-text-color-primary, #1f2937);
  background: var(--el-fill-color-blank, #fff);
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  outline: none;
}

.bd-input:focus {
  border-color: var(--el-color-primary, #409eff);
}

.bd-input--area {
  height: auto;
  padding: 6px 8px;
  font-family: ui-monospace, monospace;
  resize: vertical;
}

.bd-btn {
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  line-height: normal;
  color: var(--el-button-text-color, #4b5563);
  background: var(--el-button-bg-color, #fff);
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.bd-btn:hover:not(:disabled) {
  color: var(--el-color-primary, #409eff);
  border-color: var(--el-color-primary-light-5, #a0cfff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}

.bd-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.bd-btn--primary {
  color: #fff;
  background: var(--el-color-primary, #409eff);
  border-color: var(--el-color-primary, #409eff);
}

.bd-btn--primary:hover:not(:disabled) {
  color: #fff;
  background: var(--el-color-primary-light-3, #79bbff);
  border-color: var(--el-color-primary-light-3, #79bbff);
}

.bd-btn--danger {
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
  border-color: var(--el-color-danger-light-5, #fab6b6);
}

.bd-btn--block {
  width: 100%;
}

/* ===== 数据集列表 ===== */
.bi-designer__ds-list {
  flex: 1;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: auto;
}

.bi-designer__ds-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  margin-bottom: 4px;
  font-size: 12px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 6px;
}

.bi-designer__ds-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.bi-designer__ds-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bi-designer__ds-tag {
  flex-shrink: 0;
  padding: 0 5px;
  font-size: 10px;
  line-height: 16px;
  border-radius: 3px;
}

.bi-designer__ds-tag--static {
  color: var(--el-color-success, #67c23a);
  background: var(--el-color-success-light-9, #f0f9eb);
}

.bi-designer__ds-tag--api {
  color: var(--el-color-warning, #e6a23c);
  background: var(--el-color-warning-light-9, #fdf6ec);
}

.bi-designer__ds-meta {
  flex-shrink: 0;
  color: var(--el-text-color-secondary, #9ca3af);
}

.bi-designer__ds-delete {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  padding: 0;
  font-size: 13px;
  line-height: 16px;
  color: var(--el-text-color-secondary, #9ca3af);
  background: transparent;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.bi-designer__ds-delete:hover {
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}

.bi-designer__form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px dashed var(--el-border-color, #dcdfe6);
  border-radius: 6px;
}

.bi-designer__form-error {
  font-size: 12px;
  color: var(--el-color-danger, #f56c6c);
}

.bi-designer__form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

/* ===== 画布 ===== */
.bi-designer__canvas-wrap {
  flex: 1;
  min-width: 0;
  overflow: auto;
}

.bi-designer__canvas {
  position: relative;
  min-height: 100%;
  background: var(--bi-canvas-bg, var(--el-fill-color-lighter, #f5f7fa));
  border: 1px solid var(--bi-card-border, var(--el-border-color-lighter, #ebeef5));
  border-radius: 8px;
}

.bi-designer__canvas-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder, #c0c4cc);
  font-size: 14px;
  user-select: none;
}

.bi-designer__card {
  position: absolute;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--bi-card-bg, var(--el-bg-color, #fff));
  border: 1px solid var(--bi-card-border, var(--el-border-color-lighter, #ebeef5));
  border-radius: 8px;
  transition: box-shadow 0.15s;
  color: var(--bi-card-text, var(--el-text-color-primary, #1f2937));
}

.bi-designer__card--selected {
  border-color: var(--el-color-primary, #409eff);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7, #d9ecff);
}

.bi-designer__card--dragging {
  opacity: 0.85;
  box-shadow: 0 6px 16px rgb(0 0 0 / 15%);
}

.bi-designer__card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 6px 10px;
  cursor: grab;
  user-select: none;
}

.bi-designer__card-head:active {
  cursor: grabbing;
}

.bi-designer__card-head--static {
  cursor: default;
}

.bi-designer__card-drag {
  color: var(--el-text-color-placeholder, #c0c4cc);
  font-size: 12px;
}

.bi-designer__card-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--bi-card-text, var(--el-text-color-primary, #1f2937));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bi-designer__card-delete {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 14px;
  line-height: 18px;
  color: var(--el-text-color-secondary, #9ca3af);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bi-designer__card-delete:hover {
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}

.bi-designer__card-body {
  flex: 1;
  min-height: 0;
}

.bi-designer__card-resize {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  border-right: 2px solid var(--el-border-color, #dcdfe6);
  border-bottom: 2px solid var(--el-border-color, #dcdfe6);
  border-bottom-right-radius: 6px;
}

.bi-designer__card-resize:hover {
  border-color: var(--el-color-primary, #409eff);
}

.bi-designer__tpl-wrap {
  position: relative;
}

.bi-designer__tpl-menu {
  position: absolute;
  top: 32px;
  left: 0;
  z-index: 10;
  min-width: 160px;
  padding: 4px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
}

.bi-designer__tpl-item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  font-size: 12px;
  text-align: left;
  color: var(--el-text-color-primary, #1f2937);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bi-designer__tpl-item:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}

.bd-btn--active-on {
  color: var(--el-color-warning, #e6a23c) !important;
  border-color: var(--el-color-warning, #e6a23c) !important;
  background: var(--el-color-warning-light-9, #fdf6ec) !important;
}

.bi-designer__drill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.bi-designer__drill-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-size: 11px;
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-radius: 3px;
}

.bi-designer__drill-del {
  padding: 0;
  font-size: 12px;
  line-height: 14px;
  color: inherit;
  background: transparent;
  border: none;
  cursor: pointer;
}

.bi-designer__theme-select {
  width: 150px;
  height: 28px;
}

.bi-designer__hidden-input {
  display: none;
}
</style>
