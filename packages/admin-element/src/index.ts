/**
 * @go-wind/admin-element — 管理端壳层"机制"包（Vue 3 + Element Plus 绑定层）
 *
 * 自 go-wind-admin 的 vue-element 端 src/core 及关联基础设施抽取。
 * 依赖框架无关的 @go-wind/admin-core（transport/storage/utils）。
 *
 * 边界约定：机制进包，数据留宿主——
 * - 认证数据面经 ElementAuthGateway 注入（setAuthGateway），宿主用自己再生成的 API 客户端组装；
 * - 路由跳转编排经 setAppRouter 注入宿主 router 实例（路由表属宿主）；
 * - i18n 语言包经 setupI18n({ localesMap }) 注入（包只带 core 框架文案）；
 * - SSE 地址经 connectSSEServer(url) 注入；包内零 import.meta.env 直读。
 */

// 认证数据面边界 + 宿主 router 注入
export * from "./auth-gateway";

// 包内常量（LOGIN_PATH/DEFAULT_HOME_PATH/DRAWER_WIDTH）
export * from "./constants";

// vue-query 全局单例
export * from "./query-client";

// Pinia：initStores/resetAllStores + access/user store（lock 留宿主）
export * from "./stores";

// 传输/存储/工具（re-export admin-core，宿主一个入口即可用全量）
export * from "@go-wind/admin-core";

// i18n 引擎（setupI18n 资源注入）与框架文案模块
export * from "./i18n";
export { coreLocaleModules } from "./locales";

// 主题/偏好（PreferenceManager + use-preferences + CSS 变量 + PreferencesPanel + theme 工具）
export * from "./preferences";
// 显式具名导出 .vue 组件：flatten dts 对 export * 链上的 .vue 类型会断链
export { default as PreferencesPanel } from "./preferences/components/PreferencesPanel/index.vue";

// 权限（use-access/AccessControl/字段权限/指令）
export * from "./access";

// 路由工厂（generateAccessible 双模式 + 生成器）
export * from "./router";
// 宿主 route-generator 消费的类型显式导出（flatten dts 对 export * 深链不可靠）
export type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from "./router/types";

// 认证编排 composables（useAuth/use-token-refresh/错误文案）
export * from "./composables/use-auth";
export * from "./composables/use-token-refresh";
export * from "./composables/use-request-error-msg";
