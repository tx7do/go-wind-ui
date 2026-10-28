<template>
  <ProConfigProvider :config="providerConfig">
    <div class="pg-app" :class="{ 'pg-app--dark': dark }">
      <div class="pg-view-switch">
        <ElRadioGroup v-model="view">
          <ElRadioButton value="table">ProTable 页面</ElRadioButton>
          <ElRadioButton value="editor">编辑器套件</ElRadioButton>
          <ElRadioButton value="bi">BI 仪表盘</ElRadioButton>
          <ElRadioButton value="suite">组件套件</ElRadioButton>
        </ElRadioGroup>
      </div>
      <header class="pg-header">
        <h1>@go-wind/element-pro playground</h1>
        <div class="pg-controls">
          <ElSwitch v-model="dark" active-text="暗色" inactive-text="亮色" />
          <ElSelect v-model="locale" style="width: 120px">
            <ElOption label="中文" value="zh-CN" />
            <ElOption label="English" value="en-US" />
          </ElSelect>
          <ElSwitch v-model="hasPerm" active-text="有删除权限" inactive-text="无删除权限" />
        </div>
      </header>

      <main class="pg-main">
        <BiDemo v-if="view === 'bi'" :locale="locale" />
        <SuiteDemo v-else-if="view === 'suite'" :locale="locale" :dark="dark" />
        <EditorDemo v-else-if="view === 'editor'" />
        <ProPage v-else :config="pageConfig">
          <template #status="scope: any">
            <ElTag :type="scope.row.status === 1 ? 'success' : 'danger'" effect="plain">
              {{ scope.row.status === 1 ? (locale === 'zh-CN' ? '启用' : 'Enabled') : (locale === 'zh-CN' ? '禁用' : 'Disabled') }}
            </ElTag>
          </template>
        </ProPage>
      </main>
    </div>
  </ProConfigProvider>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { VxeUI } from "vxe-table";
import {
  ProConfigProvider,
  ProPage,
  type ProPageConfig,
} from "@go-wind/element-pro";
import { setEditorLocale } from "@go-wind/editor-vue";
import { setBiLocale } from "@go-wind/bi-vue";
import BiDemo from "./BiDemo.vue";
import SuiteDemo from "./SuiteDemo.vue";
import EditorDemo from "./EditorDemo.vue";

// ============ 演示数据（内存数据源，模拟后端） ============
interface UserRow {
  id: number;
  name: string;
  status: number;
  amount: number;
  enabled: number;
  createdAt: string;
}

let nextId = 28;
let rows: UserRow[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${String(i + 1).padStart(2, "0")}`,
  status: i % 3 === 0 ? 0 : 1,
  amount: Math.round(Math.random() * 100000) / 10,
  enabled: i % 2,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function listAction(query: any) {
  await sleep(300);
  const { page = 1, pageSize = 20, ...filters } = query;
  const filtered = rows.filter(
    (r) =>
      (!filters.name || r.name.includes(filters.name)) &&
      (filters.status === undefined || filters.status === "" || r.status === Number(filters.status))
  );
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
  };
}

// ============ Provider 配置 ============
const dark = ref(false);
const locale = ref<"zh-CN" | "en-US">("zh-CN");
const hasPerm = ref(true);
const view = ref<"table" | "editor" | "bi" | "suite">("table");

const providerConfig = computed(() => ({
  locale: locale.value,
  skeleton: true,
  resolveTableId: () => "playground-users",
  hasAccess: (codes: string[]) => (hasPerm.value ? true : !codes.includes("user:delete")),
}));

// 编辑器包语言联动
watch(locale, (v) => {
  setEditorLocale(v);
  setBiLocale(v);
}, { immediate: true });

// EP 官方暗色方案：html.dark 作用域切换 css-vars；
// vxe 引擎另需 VxeUI.setTheme 翻转 data-vxe-ui-theme（宿主主题层的标准集成步骤）
watch(
  dark,
  (v) => {
    document.documentElement.classList.toggle("dark", v);
    VxeUI.setTheme(v ? "dark" : "light");
  },
  { immediate: true }
);

// ============ 页面配置 ============
const pageConfig = computed(
  (): ProPageConfig => ({
  exportFilename: "users",
  engine: "vxe",
  rowKey: "id",
  skeleton: true,
  search: {
    grid: true,
    fields: [
      { type: "input", label: locale.value === "zh-CN" ? "名称" : "Name", field: "name", attrs: { clearable: true } },
      {
        type: "select",
        label: locale.value === "zh-CN" ? "状态" : "Status",
        field: "status",
        options: [
          { label: locale.value === "zh-CN" ? "启用" : "Enabled", value: 1 },
          { label: locale.value === "zh-CN" ? "禁用" : "Disabled", value: 0 },
        ],
      },
    ],
  },
  table: {
    listAction,
    deleteAction: async (ids: string) => {
      await sleep(200);
      const idSet = new Set(ids.split(",").map(Number));
      rows = rows.filter((r) => !idSet.has(r.id));
    },
    toolbar: ["add", "delete"],
    defaultToolbar: ["refresh", "filter", "search", "zoom", "exports"],
    columns: [
      { type: "selection", width: 50 },
      { type: "index", label: "#", width: 60 },
      { prop: "name", label: locale.value === "zh-CN" ? "名称" : "Name", minWidth: 140 },
      { prop: "status", label: locale.value === "zh-CN" ? "状态" : "Status", slotName: "status", width: 100 },
      { prop: "amount", label: locale.value === "zh-CN" ? "金额" : "Amount", cellType: "price", pricePrefix: "¥", width: 120 },
      {
        prop: "enabled",
        label: locale.value === "zh-CN" ? "开关" : "Switch",
        cellType: "switch",
        width: 100,
      },
      { prop: "createdAt", label: locale.value === "zh-CN" ? "创建时间" : "Created", cellType: "date", width: 180 },
      {
        prop: "action",
        label: locale.value === "zh-CN" ? "操作" : "Actions",
        fixed: "right",
        width: 200,
        cellType: "tool",
        buttons: [
          { name: "edit", label: locale.value === "zh-CN" ? "编辑" : "Edit" },
          { name: "view", label: locale.value === "zh-CN" ? "查看" : "View" },
          { name: "detail", label: locale.value === "zh-CN" ? "详情" : "Detail" },
          { name: "delete", label: locale.value === "zh-CN" ? "删除" : "Delete", auth: "user:delete", type: "danger" },
        ],
      },
    ],
    modifyAction: async (data) => {
      const row = rows.find((r) => r.id === Number(data.id));
      if (row) (row as any)[data.field] = data.value;
    },
  },
  modal: {
    component: "drawer",
    drawer: { size: "480px" },
    fields: [
      {
        type: "input",
        label: locale.value === "zh-CN" ? "名称" : "Name",
        field: "name",
        rules: [{ required: true, message: locale.value === "zh-CN" ? "请输入名称" : "Name is required" }],
      },
      {
        type: "select",
        label: locale.value === "zh-CN" ? "状态" : "Status",
        field: "status",
        options: [
          { label: "1", value: 1 },
          { label: "0", value: 0 },
        ],
      },
      { type: "input-number", label: locale.value === "zh-CN" ? "金额" : "Amount", field: "amount" },
      { type: "textarea", label: locale.value === "zh-CN" ? "备注" : "Remark", field: "remark" },
    ],
    submitAction: async (data: any) => {
      await sleep(200);
      if (data.id && rows.some((r) => r.id === data.id)) {
        const idx = rows.findIndex((r) => r.id === data.id);
        rows[idx] = { ...rows[idx], ...data };
      } else {
        rows.unshift({ ...data, id: nextId++, createdAt: new Date().toISOString() });
      }
      ElMessage.success("OK");
    },
  },
}));
</script>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
}

.pg-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  box-sizing: border-box;
  background: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}

.pg-view-switch {
  padding-bottom: 8px;
}

.pg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
}

.pg-header h1 {
  font-size: 16px;
  margin: 0;
}

.pg-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pg-main {
  flex: 1;
  min-height: 0;
}
</style>
