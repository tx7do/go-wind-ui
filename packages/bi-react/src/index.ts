/**
 * @go-wind-ui/bi-react
 *
 * React 19 BI 仪表盘渲染器（BiDashboard）构建在 @go-wind-ui/bi-core 之上。
 * 设计器当前为 Vue 一等公民（designer-vue），React 侧桥接壳规划于 M3。
 * 设计文档：docs/bi-designer.md
 */
import "./styles.css";

export { BiProvider, useBiEnv, useBiTheme } from "./env";
export type { BiEnv } from "./env";
export { BiChart } from "./BiChart";
export type { BiChartProps } from "./BiChart";
export { BiDashboard } from "./BiDashboard";
export type { BiDashboardProps } from "./BiDashboard";
