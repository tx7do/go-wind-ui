/**
 * @go-wind-ui/element-pro
 *
 * Vue 3 + Element Plus + vxe-table 的配置驱动 CRUD 组件库。
 * 一个配置对象描述一个完整列表页（搜索 → 工具栏 → 表格 → 分页 → 弹窗）。
 *
 * 请求层完全由应用注入（listAction / deleteAction / submitAction），
 * 本库不绑定任何 HTTP 客户端与后端约定。
 */
import "./styles/vxe.scss";

// ========== 组件 ==========
export { default as ProForm } from "./ProForm/index.vue";
export { default as ProTable } from "./ProTable/index.vue";
export { default as ProModal } from "./ProModal/index.vue";
export { default as ProSearch } from "./ProSearch/index.vue";
export { default as ProPagination } from "./ProPagination/index.vue";
export { default as ProToolbar } from "./ProToolbar/index.vue";
export { default as ProPage } from "./ProPage/index.vue";
export { default as ProFileSelect } from "./ProFileSelect/index.vue";
export { default as ProDescriptions } from "./ProDescriptions/index.vue";
export { default as ProSplitter } from "./ProSplitter/index.vue";
export { default as ExportAllDropdown } from "./ExportAllDropdown.vue";

// ========== 表单辅助组件 ==========
export { default as ProInputTag } from "./components/InputTag/index.vue";
export { default as ProIconSelect } from "./components/IconSelect/index.vue";

// ========== 图标 ==========
export { default as ProIcon } from "./icons/ProIcon.vue";
export { INTERNAL_SVGS } from "./icons/svgs";

// ========== 配置注入 ==========
export { default as ProConfigProvider } from "./config-provider/ProConfigProvider.vue";
export {
  useProConfig,
  useProAccess,
  provideProConfig,
  PRO_CONFIG_KEY,
} from "./config-provider/context";
export type { ProConfig } from "./config-provider/context";

// ========== i18n ==========
export {
  $t,
  i18n,
  useI18n,
  setProLocale,
  setProMessages,
  createTranslator,
} from "./locale";
export type { ProLocale, ProMessages } from "./locale";
export { default as zhCN } from "./locale/zh-CN";
export { default as enUS } from "./locale/en-US";

// ========== 类型导出 ==========
export type { ProListResult, ProExportQuery } from "./types";
export * from "./ProForm/types";
export * from "./ProTable/types";
export * from "./ProModal/types";
export * from "./ProSearch/types";
export * from "./ProPagination/types";
export * from "./ProToolbar/types";
export * from "./ProPage/types";
export * from "./ProFileSelect/types";
export * from "./ProDescriptions/types";

// ========== Composables ==========
export { useTableState } from "./composables/useTableState";
export type { UseTableConfig } from "./composables/useTableState";
export { useModalState } from "./composables/useModalState";
export { useDrawerForm } from "./composables/useDrawerForm";
export { useDrawerCloseGuard } from "./composables/use-drawer-close-guard";

// Level 2: Api 命令式控制
export { ProPageApi } from "./composables/ProPageApi";
export type { ProPageExpose, ProPageState } from "./composables/ProPageApi";
export { useProPage } from "./composables/useProPage";
export type { UseProPage } from "./composables/useProPage";

// Level 2.5: 弹窗抽离（connectedComponent）
export { ProModalApi } from "./composables/useProModal";
export type { ProModalState, UseProModalOptions } from "./composables/useProModal";
export { useProModal, injectProModalApi } from "./composables/useProModal";
export type { UseProModal } from "./composables/useProModal";

// ========== 常量 ==========
export {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZES,
  DEFAULT_DRAWER_WIDTH,
} from "./constants";
