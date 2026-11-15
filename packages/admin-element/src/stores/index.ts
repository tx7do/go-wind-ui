/**
 * Pinia store 集合（机制层：access/user；布局壳专属的 lock store 留宿主）。
 * defineStore 定义可入包；安装仍由宿主在 bootstrap 调 initStores(app, { namespace }) 触发。
 */
export * from "./setup";
export * from "./modules/access.store";
export * from "./modules/app-user.store";
