import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { FALLBACK_LOCALE, type SupportedLocale } from '../../locales';

/**
 * initI18n 的资源配置由宿主注入：包只带机制（引擎/回退/命名空间约定），
 * 文案 = 包内置框架命名空间（coreResources）+ 宿主业务命名空间合并后传入。
 */
export interface InitI18nOptions {
  /** 合并后的完整语言资源（语言 -> 命名空间 -> 文案） */
  resources: Record<string, Record<string, Record<string, unknown>>>;
  /** 全部命名空间列表（一般取 merged['zh-CN'] 的键） */
  namespaces: string[];
  /** 支持的语言列表（默认 zh-CN/en-US） */
  supportedLngs?: readonly string[];
  /** 回退语言（默认 zh-CN） */
  fallbackLng?: string;
  /** 开发环境缺失 key 告警（宿主传 import.meta.env.DEV，包内不读 env） */
  missingKeyWarn?: boolean;
}

export const initI18n = async (initialLang: SupportedLocale, options: InitI18nOptions) => {
  await i18n.use(initReactI18next).init({
    lng: initialLang,
    resources: options.resources as unknown as import('i18next').Resource, // 包框架命名空间 + 宿主扩展模块（宿主合并后传入）
    fallbackLng: options.fallbackLng ?? FALLBACK_LOCALE,
    supportedLngs: options.supportedLngs ?? ['zh-CN', 'en-US'],

    defaultNS: 'common',
    ns: options.namespaces, // 声明所有命名空间

    // 缺失 key 处理（开发环境）
    missingKeyHandler: options.missingKeyWarn
      ? (lngs: readonly string[], ns: string, key: string) => {
          console.warn(`[i18n] Missing: "${key}" in "${ns}" for "${lngs[0]}"`);
        }
      : undefined,
  });

  return i18n;
};
