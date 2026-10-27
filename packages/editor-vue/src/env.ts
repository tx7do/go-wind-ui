/**
 * 编辑器运行环境注入：主题跟随 + 图片上传。
 *
 * 全部可缺省——缺省时零配置可用：
 * - 主题：默认监听 html.dark class（MutationObserver）+ 系统偏好（auto 模式）
 * - 上传：默认转 base64 data URL；接后端上传时注入 uploadImage 返回可访问 URL
 */
import { computed, inject, provide, ref, watchEffect } from "vue";
import type { ComputedRef, InjectionKey, Ref } from "vue";
import { createLocaleStore } from "@go-wind-ui/locale";

import zhCN from "./locale/zh-CN";
import enUS from "./locale/en-US";

export type EditorThemeMode = "dark" | "light" | "auto";

export interface EditorEnv {
  /** 宿主主题模式 getter（响应式，可被 watch 追踪）；缺省读 html.dark + 系统偏好 */
  themeMode?: () => EditorThemeMode;
  /** 图片上传：返回可内嵌的 URL（http 或 data URL）；缺省转 base64 */
  uploadImage?: (file: File) => Promise<string>;
}

const EDITOR_ENV_KEY: InjectionKey<EditorEnv> = Symbol("EDITOR_ENV");

const DEFAULT_ENV: EditorEnv = {};

export function provideEditorEnv(env: EditorEnv) {
  provide(EDITOR_ENV_KEY, env);
}

export function useEditorEnv(): EditorEnv {
  return inject(EDITOR_ENV_KEY, DEFAULT_ENV);
}

// ============ 主题：单一响应式源 ============
// html.dark class 监听器（模块级单例，多个编辑器共享）
const classDark = ref(false);
let observerBound = false;

function bindHtmlDarkObserver() {
  if (observerBound || typeof document === "undefined") return;
  observerBound = true;
  const sync = () => {
    classDark.value = document.documentElement.classList.contains("dark");
  };
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  // 模块级单例无需按组件卸载；页面级 SPA 生命周期内常驻
}

const systemDark = ref(false);

function bindSystemDarkListener() {
  if (typeof window === "undefined" || !window.matchMedia) return;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  systemDark.value = mq.matches;
  mq.addEventListener("change", (e) => {
    systemDark.value = e.matches;
  });
}

bindHtmlDarkObserver();
bindSystemDarkListener();

/** 主题翻转计数器：任何一次亮暗切换都自增，供 watch(() => themeTick.value) 触发 */
export const themeTick = computed(() => (classDark.value ? 1 : 0) + (systemDark.value ? 1 : 0));

/** 非响应式读取当前是否暗色（watch 回调里取值用） */
export function isDarkNow(): boolean {
  return classDark.value || systemDark.value;
}

export { isDarkNow as isDarkMode };

/**
 * 当前是否暗色（全包唯一的主题真相源）。
 * 宿主注入 themeMode getter 时经 watchEffect 追踪其响应式依赖；
 * 否则 auto 模式 = html.dark class 优先，其次系统偏好。
 */
export function useEditorDark(): ComputedRef<boolean> {
  const env = useEditorEnv();
  if (env.themeMode) {
    const manual = ref(false);
    watchEffect(() => {
      const mode = env.themeMode!();
      manual.value = mode === "dark" || (mode === "auto" ? classDark.value || systemDark.value : false);
    });
    return computed(() => manual.value);
  }
  return computed(() => classDark.value || systemDark.value);
}

// ============ 上传 ============
/** 缺省上传：转 base64 data URL（零配置可用；生产建议注入 uploadImage 走服务端） */
export async function defaultUploadImage(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read file failed"));
    reader.readAsDataURL(file);
  });
}

export function useEditorUpload(): (file: File) => Promise<string> {
  const env = useEditorEnv();
  return (file: File) => (env.uploadImage ? env.uploadImage(file) : defaultUploadImage(file));
}

// ============ i18n ============
export type EditorLocale = "zh-CN" | "en-US";

const store = createLocaleStore({
  packs: { "zh-CN": zhCN, "en-US": enUS },
  defaultLocale: "zh-CN",
});

/** 全局翻译 */
export const $t = store.t;
/** vue-i18n 兼容形态 */
export const i18n = store.i18n;
/** 组件内：返回 { t } */
export function useI18n() {
  return store.useI18n();
}
export function setEditorLocale(locale: EditorLocale) {
  store.setLocale(locale);
}
export function setEditorMessages(messages: Record<string, any> | null) {
  store.setMessages(messages);
}
/** 创建绑定指定语言的翻译器（Provider 作用域覆盖用） */
export const createTranslator = store.createTranslator;
