<template>
  <div class="bi-demo">
    <ElRadioGroup v-model="mode" class="bi-demo__switch">
      <ElRadioButton value="render">渲染器</ElRadioButton>
      <ElRadioButton value="designer">设计器</ElRadioButton>
    </ElRadioGroup>

    <!-- 渲染器：固定 schema + 注入 api resolver（演示 loading→数据） -->
    <BiDashboard
      v-if="mode === 'render'"
      :schema="renderSchema"
      :view="{ designWidth: 1920, fit: 'width' }"
      class="bi-demo__main"
    />

    <!-- 设计器：内置 demo schema；@change 抛出最新 schema -->
    <BiDesigner v-else :demo="true" class="bi-demo__main" @change="onDesignerChange" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElRadioButton, ElRadioGroup } from "element-plus";
import { BiDashboard, BiDesigner, provideBiEnv } from "@go-wind/bi-vue";
import { setBiLocale } from "@go-wind/bi-vue";
import type { BiDashboardSchema } from "@go-wind/bi-core";

const props = defineProps<{ locale: "zh-CN" | "en-US" }>();

watch(
  () => props.locale,
  (v) => setBiLocale(v),
  { immediate: true }
);

// env 注入：演示 api 数据集经 resolver 取数（真实场景走应用的请求层）
provideBiEnv({
  resolvers: {
    ds_api_orders: async () => {
      await new Promise((r) => setTimeout(r, 600));
      return Array.from({ length: 6 }, (_, i) => ({
        city: ["北京", "上海", "广州", "深圳", "杭州", "成都"][i],
        orders: Math.round(120 + Math.random() * 380),
      }));
    },
  },
});

const mode = ref<"render" | "designer">("render");

const renderSchema: Partial<BiDashboardSchema> = {
  name: "render-demo",
  linkage: { enabled: true },
  theme: { key: "tech-blue" },
  datasets: [
    {
      id: "ds_month",
      name: "月度销售",
      type: "static",
      rows: Array.from({ length: 12 }, (_, i) => ({
        month: `${i + 1}月`,
        sales: Math.round(80 + Math.sin(i / 2) * 60 + i * 8),
        target: 160,
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
      id: "ds_orders",
      name: "订单明细",
      type: "static",
      rows: Array.from({ length: 48 }, (_, i) => ({
        city: ["北京", "上海", "广州", "深圳", "杭州", "成都"][i % 6],
        category: ["硬件", "软件", "服务"][i % 3],
        amount: Math.round(50 + Math.random() * 450),
      })),
    },
    {
      id: "ds_api_orders",
      name: "城市订单 (API)",
      type: "api",
      api: {},
    },
    {
      id: "ds_funnel",
      name: "转化漏斗",
      type: "static",
      rows: [
        { stage: "访问", count: 5000 },
        { stage: "注册", count: 3200 },
        { stage: "下单", count: 1800 },
        { stage: "支付", count: 900 },
        { stage: "复购", count: 360 },
      ],
    },
    {
      id: "ds_heat",
      name: "时段热度",
      type: "static",
      rows: [
        { day: "周一", hour: "9点", value: 62 },
        { day: "周一", hour: "15点", value: 88 },
        { day: "周三", hour: "9点", value: 45 },
        { day: "周三", hour: "15点", value: 95 },
        { day: "周五", hour: "9点", value: 70 },
        { day: "周五", hour: "15点", value: 78 },
      ],
    },
    {
      id: "ds_relations",
      name: "调用关系",
      type: "static",
      rows: [
        { source: "网关", target: "认证", weight: 300 },
        { source: "网关", target: "订单", weight: 420 },
        { source: "订单", target: "支付", weight: 260 },
        { source: "订单", target: "库存", weight: 180 },
        { source: "支付", target: "通知", weight: 90 },
        { source: "认证", target: "用户", weight: 150 },
        { source: "库存", target: "通知", weight: 60 },
      ],
    },
  ],
  charts: [
    {
      id: "r_bar",
      title: "销售 vs 目标",
      datasetId: "ds_month",
      type: "bar",
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      encoding: { dimension: "month", measures: ["sales", "target"] },
      style: { showLegend: true },
    },
    {
      id: "r_area",
      title: "销售趋势",
      datasetId: "ds_month",
      type: "area",
      x: 6,
      y: 0,
      w: 6,
      h: 4,
      encoding: { dimension: "month", measure: "sales" },
    },
    {
      id: "r_donut",
      title: "渠道分布",
      datasetId: "ds_channel",
      type: "donut",
      x: 0,
      y: 4,
      w: 4,
      h: 4,
      encoding: { dimension: "channel", measure: "amount" },
    },
    {
      id: "r_radar",
      title: "城市订单",
      datasetId: "ds_api_orders",
      type: "radar",
      x: 4,
      y: 4,
      w: 4,
      h: 4,
      encoding: { dimension: "city", measure: "orders" },
    },
    {
      id: "r_line",
      title: "目标对照",
      datasetId: "ds_month",
      type: "line",
      x: 8,
      y: 4,
      w: 4,
      h: 4,
      encoding: { dimension: "month", measure: "target" },
    },
    {
      id: "r_pivot",
      title: "订单透视（S2）",
      datasetId: "ds_orders",
      engine: "s2",
      type: "pivot",
      x: 0,
      y: 8,
      w: 6,
      h: 4,
      encoding: { dimension: "city", series: "category", measure: "amount" },
      aggregation: "sum",
    },
    {
      id: "r_funnel",
      title: "转化漏斗",
      datasetId: "ds_funnel",
      type: "funnel",
      x: 6,
      y: 8,
      w: 6,
      h: 4,
      encoding: { dimension: "stage", measure: "count" },
    },
    {
      id: "r_heatmap",
      title: "时段热度",
      datasetId: "ds_heat",
      type: "heatmap",
      x: 0,
      y: 12,
      w: 6,
      h: 4,
      encoding: { dimension: "day", series: "hour", measure: "value" },
    },
    {
      id: "r_sankey",
      title: "调用流向（桑基）",
      datasetId: "ds_relations",
      type: "sankey",
      x: 6,
      y: 12,
      w: 6,
      h: 4,
      encoding: { dimension: "source", series: "target", measure: "weight" },
    },
    {
      id: "r_graph",
      title: "调用关系（G6）",
      datasetId: "ds_relations",
      engine: "g6",
      type: "graph",
      x: 6,
      y: 8,
      w: 6,
      h: 4,
      encoding: { dimension: "source", series: "target", measure: "weight" },
    },
    {
      id: "r_drill",
      title: "订单下钻（城市→品类）",
      datasetId: "ds_orders",
      type: "bar",
      x: 0,
      y: 12,
      w: 6,
      h: 4,
      encoding: { dimension: "city", measure: "amount" },
      aggregation: "sum",
      sort: { by: "measure", order: "desc" },
      drill: { path: ["city", "category"] },
    },
  ],
};

function onDesignerChange(schema: BiDashboardSchema) {
  // 宿主保存点：真实场景落库/localStorage
  console.log("[bi-demo] designer change:", schema.name, schema.charts.length, "charts");
}
</script>

<style scoped>
.bi-demo {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bi-demo__switch {
  flex-shrink: 0;
}

.bi-demo__main {
  flex: 1;
  min-height: 0;
}
</style>
