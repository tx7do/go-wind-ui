/**
 * element-pro 的 i18n：内部实现委托给 @go-wind/locale 的 store 工厂，
 * 公开 API（$t / useI18n / i18n / setProLocale / setProMessages）保持稳定。
 *
 * - 默认 zh-CN，内置 zh-CN / en-US 两包
 * - ProConfigProvider 可传 locale 切换内置包，或传 messages 深合并覆盖
 */
import { createLocaleStore } from "@go-wind/locale";
import zhCN from "./zh-CN";
import enUS from "./en-US";

export type ProLocale = "zh-CN" | "en-US";
export type ProMessages = Record<string, any>;

const store = createLocaleStore({
  packs: {
    "zh-CN": zhCN as ProMessages,
    "en-US": enUS as ProMessages,
  },
  defaultLocale: "zh-CN",
});

/** 全局翻译（无 Provider 上下文时使用全局语言状态） */
export const $t = store.t;

/** vue-i18n 兼容形态：i18n.global.t */
export const i18n = store.i18n;

/** 组件内使用：返回 { t }，与 vue-i18n 的 useI18n 同形 */
export function useI18n() {
  return store.useI18n();
}

export function setProLocale(locale: ProLocale) {
  store.setLocale(locale);
}

export function setProMessages(messages: ProMessages) {
  store.setMessages(messages);
}

/** 创建绑定指定语言的翻译器（Provider 作用域覆盖用） */
export const createTranslator = store.createTranslator;

export const localeRef = store.localeRef;
