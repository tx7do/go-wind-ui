import type { ResourceLanguage } from 'i18next';
import enUS from './en-US';
import zhCN from './zh-CN';

export type SupportedLocale = 'zh-CN' | 'en-US';

export const supportedLocales: SupportedLocale[] = ['zh-CN', 'en-US'];

export const FALLBACK_LOCALE: SupportedLocale = 'zh-CN';

/**
 * 包内置的框架命名空间文案（common/auth/editor/preferences）。
 * 宿主把业务命名空间与之合并后传给 initI18n——同名命名空间宿主可整体覆盖。
 */
export const coreResources: Record<SupportedLocale, ResourceLanguage> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export const CORE_NAMESPACES = Object.keys(zhCN);
