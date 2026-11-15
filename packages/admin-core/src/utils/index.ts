/**
 * 框架无关工具函数统一导出（admin-core 版）。
 * 与宿主 utils 桶的差异：不含业务件（validate/tenant/chart-palette）与
 * Element 绑定件（theme——耦合 preferences 与 vxe-table，随 admin-element 走）。
 */
export * from "./crypto";
export * from "./color";
export * from "./format";
export * from "./utils";
export * from "./query";
export * from "./merge";
export * from "./window";
export * from "./nprogress";
export * from "./tree";
export * from "./inference";
export * from "./date";
export * from "./letter";
export * from "./dom";
export * from "./state-handler";
export * from "./cn";
export * from "./download";
export * from "./diff";

export { default as cloneDeep } from "lodash.clonedeep";
