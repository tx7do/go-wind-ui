/**
 * BI 运行环境注入：主题跟随 + 数据集 resolver + 语言。
 * 缺省零配置：主题自动跟随 html.dark；static 数据集无需 resolver。
 */
import { computed, inject, provide, ref, watchEffect } from "vue";
import type { ComputedRef, InjectionKey } from "vue";
import { createLocaleStore } from "@go-wind/locale";
import { BI_MESSAGES_EN, BI_MESSAGES_ZH, detectDark, resolveTheme, watchDark } from "@go-wind/bi-core";
import type { BiDatasetResolver, BiResolvedTheme } from "@go-wind/bi-core";

export type BiLocale = "zh-CN" | "en-US";

export interface BiEnv {
  /** 宿主主题模式 getter（响应式）；缺省自动跟随 html.dark + 系统偏好 */
  themeMode?: () => "light" | "dark" | "auto";
  /** api 型数据集的取数函数表（键 = dataset.id） */
  resolvers?: Record<string, BiDatasetResolver>;
  /** 界面语言 */
  locale?: BiLocale;
  /** 自定义文案（与内置包深合并） */
  messages?: Record<string, any> | null;
}

const BI_ENV_KEY: InjectionKey<BiEnv> = Symbol("BI_ENV");

const DEFAULT_ENV: BiEnv = {};

export function provideBiEnv(env: BiEnv) {
  provide(BI_ENV_KEY, env);
}

export function useBiEnv(): BiEnv {
  return inject(BI_ENV_KEY, DEFAULT_ENV);
}

// ============ 主题：模块级单一响应式源 ============
const darkRef = ref(false);
let bound = false;

function ensureDarkBinding() {
  if (bound || typeof document === "undefined") return;
  bound = true;
  watchDark((dark) => {
    darkRef.value = dark;
  });
}

/**
 * 当前图表主题（编译期注入 option）。
 * env.themeMode 缺省时跟随 html.dark + 系统偏好；提供时经 computed 追踪其响应式依赖。
 */
export function useBiTheme(): ComputedRef<BiResolvedTheme> {
  const env = useBiEnv();
  ensureDarkBinding();
  return computed(() => {
    const fallback = darkRef.value ? "dark" : "light";
    if (!env.themeMode) return resolveTheme(fallback);
    const mode = env.themeMode();
    return resolveTheme(mode === "auto" ? fallback : mode);
  });
}

// ============ i18n ============
const localeStore = createLocaleStore({
  packs: { "zh-CN": BI_MESSAGES_ZH, "en-US": BI_MESSAGES_EN },
  defaultLocale: "zh-CN",
});

/** 组件内使用：返回 { t }（跟随 env.locale / setBiLocale 全局状态） */
export function useBiI18n() {
  return localeStore.useI18n();
}

export function setBiLocale(locale: BiLocale) {
  localeStore.setLocale(locale);
}

export function setBiMessages(messages: Record<string, any> | null) {
  localeStore.setMessages(messages);
}

/** 组件挂载时应用 env 的 locale/messages */
export function applyBiLocaleFromEnv() {
  const env = useBiEnv();
  watchEffect(() => {
    if (env.locale) localeStore.setLocale(env.locale);
    if (env.messages) localeStore.setMessages(env.messages);
  });
}
