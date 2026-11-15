/**
 * 包内置框架文案（core 命名空间，zh-CN/en-US）。
 * 以懒加载模块形态导出，供宿主合并进 setupI18n 的 localesMap（同名宿主覆盖）。
 */
import zhCN from "./zh-CN/core.json";
import enUS from "./en-US/core.json";

export const coreLocaleModules: Record<string, () => Promise<{ default: unknown }>> = {
  "zh-CN": async () => ({ default: zhCN }),
  "en-US": async () => ({ default: enUS }),
};
