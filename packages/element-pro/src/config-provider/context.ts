/**
 * ProConfigProvider 上下文：宿主应用向组件库注入集成点。
 *
 * 全部可缺省——缺省时库按零配置运行：
 * - locale/messages 不传 → 内置 zh-CN
 * - hasAccess 不传 → 权限码全部放行
 * - resolveTableId 不传 → 不启用 vxe 列配置持久化
 * - skeleton 不传 → 允许骨架屏
 */
import { inject, provide } from "vue";
import type { InjectionKey } from "vue";
import type { ProLocale, ProMessages } from "../locale";

export interface ProConfig {
  /** 内置语言切换 */
  locale?: ProLocale;
  /** 自定义文案，与内置包深合并（键形见 locale/zh-CN.ts） */
  messages?: ProMessages;
  /** 权限码判定（与按钮 auth 配置配合）；缺省全放行 */
  hasAccess?: (codes: string[]) => boolean;
  /** 返回当前页面的表格持久化 id（如路由路径）；缺省不启用 vxe 列配置持久化 */
  resolveTableId?: () => string | undefined;
  /** 全局骨架屏开关（对应应用偏好 transition.loading）；缺省 true */
  skeleton?: boolean;
}

export const PRO_CONFIG_KEY: InjectionKey<ProConfig> = Symbol("PRO_CONFIG");

const DEFAULT_CONFIG: Required<Pick<ProConfig, "skeleton">> & ProConfig = {
  skeleton: true,
  hasAccess: () => true,
};

export function provideProConfig(config: ProConfig) {
  provide(PRO_CONFIG_KEY, config);
}

export function useProConfig(): ProConfig {
  return inject(PRO_CONFIG_KEY, DEFAULT_CONFIG);
}

/** 权限判定快捷入口：无码直接放行，有码走注入的 hasAccess */
export function useProAccess() {
  const config = useProConfig();
  const hasAccess = (codes?: string | string[]): boolean => {
    if (!codes || (Array.isArray(codes) && codes.length === 0)) return true;
    const list = Array.isArray(codes) ? codes : [codes];
    return config.hasAccess ? config.hasAccess(list) : true;
  };
  return { hasAccess };
}
