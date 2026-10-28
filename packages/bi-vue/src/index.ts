/**
 * @go-wind/bi-vue
 *
 * Vue 3 BI 仪表盘：BiDashboard 只读渲染器 + BiDesigner 画布设计器。
 * schema 与状态机在 @go-wind/bi-core，设计文档见 docs/bi-designer.md。
 */
import "./styles/base.scss";

export { default as BiDashboard } from "./BiDashboard.vue";
export { default as BiDesigner } from "./BiDesigner.vue";
export { default as BiChart } from "./BiChart.vue";

// 环境注入（主题跟随 / resolvers / i18n）
export {
  provideBiEnv,
  useBiEnv,
  useBiTheme,
  useBiI18n,
  setBiLocale,
  setBiMessages,
} from "./env";
export type { BiEnv, BiLocale } from "./env";
