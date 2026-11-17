/**
 * 包内置框架文案（core 命名空间）导出壳。
 *
 * 2026-11-17 起数据清空：core 文案跟着视图走，全部由宿主自带（vue-element
 * 宿主的 src/locales/{zh-CN,en-US}/core.json 深合并覆盖本导出，键结构兼容）。
 * 包本身不渲染任何 core.* 文案（dist 实证零字面引用），不再内置业务默认值。
 * 保留空导出是为了宿主的 `import { coreLocaleModules }` 不 break；新宿主
 * 请自带 core.json。
 */
import zhCN from "./zh-CN/core.json";
import enUS from "./en-US/core.json";

export const coreLocaleModules: Record<string, () => Promise<{ default: unknown }>> = {
  "zh-CN": async () => ({ default: zhCN }),
  "en-US": async () => ({ default: enUS }),
};
