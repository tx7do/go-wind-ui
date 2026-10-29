/**
 * 编辑器运行环境：i18n + 图片上传注入（React context 版）。
 *
 * - useTranslation() 与 react-i18next 同形，组件零改动迁移
 * - 主题判定：html.dark class 优先，其次系统偏好（与 MutationObserver 跟踪配合）
 * - 上传：props.uploadImage > EditorProvider.uploadImage > base64 data URL
 */
import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import zhCN from "./locale/zh-CN";
import enUS from "./locale/en-US";

export type EditorLocale = "zh-CN" | "en-US";
export type LocaleMessages = Record<string, any>;
export type Translator = (
  key: string,
  /** 插值参数（对象）或 i18next 风格的缺省文案（字符串） */
  paramsOrDefault?: Record<string, unknown> | string
) => string;

const packs: Record<string, LocaleMessages> = {
  "zh-CN": zhCN as LocaleMessages,
  "en-US": enUS as LocaleMessages,
};

let globalLocale: EditorLocale = "zh-CN";
let globalMessages: LocaleMessages | null = null;

export function setEditorLocale(locale: EditorLocale) {
  globalLocale = locale;
}

export function setEditorMessages(messages: LocaleMessages | null) {
  globalMessages = messages;
}

function lookup(pack: LocaleMessages, key: string): string | undefined {
  let cur: any = pack;
  for (const part of key.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(tpl: string, params?: Record<string, unknown>): string {
  if (!params) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (m, name) =>
    params[name] !== undefined ? String(params[name]) : m
  );
}

function makeT(locale: EditorLocale, overrides: LocaleMessages | null): Translator {
  const base = packs[locale] ?? packs["zh-CN"];
  const merged =
    overrides && Object.keys(overrides).length ? deepMerge(base, overrides) : base;
  return (key, paramsOrDefault) => {
    const fallback = typeof paramsOrDefault === "string" ? paramsOrDefault : undefined;
    const params =
      paramsOrDefault && typeof paramsOrDefault === "object" ? paramsOrDefault : undefined;
    const hit = lookup(merged, key) ?? lookup(packs["zh-CN"], key);
    return interpolate(hit ?? fallback ?? key, params);
  };
}

function deepMerge(base: LocaleMessages, extra: LocaleMessages): LocaleMessages {
  const out: LocaleMessages = { ...base };
  for (const key of Object.keys(extra)) {
    const b = out[key];
    const e = extra[key];
    out[key] =
      b && e && typeof b === "object" && typeof e === "object"
        ? deepMerge(b, e)
        : e;
  }
  return out;
}

// ============ 环境注入 ============

export interface EditorEnv {
  /** 覆盖界面语言 */
  locale?: EditorLocale;
  /** 自定义文案（与内置包深合并） */
  messages?: LocaleMessages | null;
  /** 全局图片上传（组件级 uploadImage prop 优先） */
  uploadImage?: (file: File) => Promise<string>;
}

const EnvContext = createContext<EditorEnv | null>(null);

export function EditorProvider(props: { env: EditorEnv; children: ReactNode }) {
  return <EnvContext.Provider value={props.env}>{props.children}</EnvContext.Provider>;
}

export function useEditorEnv(): EditorEnv {
  return useContext(EnvContext) ?? {};
}

/** react-i18next 兼容形态：const { t } = useTranslation() */
export function useTranslation(): { t: Translator } {
  const env = useEditorEnv();
  return { t: makeT(env.locale ?? globalLocale, env.messages ?? globalMessages) };
}

/** 全局翻译（context 外使用） */
export const $t: Translator = (key, params) =>
  makeT(globalLocale, globalMessages)(key, params);

// ============ 主题 ============

/**
 * 是否暗色。判定顺序（前者一旦命中即终局）：
 *   1. 宿主显式的 `data-theme="dark" | "light"`（antd 系宿主常用这套，如 go-wind-admin react 端）
 *   2. `html.dark` / `body.dark` class（Tailwind / element-plus 系宿主）
 *   3. 系统偏好 prefers-color-scheme
 * 宿主只要给了 1 或 2，就不再看系统偏好——否则"应用亮色 + 系统暗色"会把编辑器染黑。
 */
export function isDarkMode(): boolean {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    const attr = root.getAttribute("data-theme") ?? document.body?.getAttribute("data-theme");
    if (attr === "dark") return true;
    if (attr === "light") return false;
    if (root.classList.contains("dark") || document.body?.classList.contains("dark")) return true;
  }
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return true;
  }
  return false;
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

/** 生效的上传函数：组件 prop > Provider > base64 缺省 */
export function resolveUpload(
  propUpload: ((file: File) => Promise<string>) | undefined
): (file: File) => Promise<string> {
  const env = useEditorEnv();
  return propUpload ?? env.uploadImage ?? defaultUploadImage;
}
