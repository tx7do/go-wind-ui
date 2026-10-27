/**
 * 极简内置 i18n：不依赖 vue-i18n，避免宿主双实例问题。
 *
 * - 默认 zh-CN，内置 zh-CN / en-US 两包
 * - ProConfigProvider 可传 locale 切换内置包，或传 messages 深合并覆盖
 * - 导出 useI18n / $t / i18n 三种形态，兼容不同调用习惯
 */
import { computed, inject, ref, unref } from "vue";
import type { MaybeRef } from "vue";
import zhCN from "./zh-CN";
import enUS from "./en-US";

export type ProLocale = "zh-CN" | "en-US";
export type ProMessages = Record<string, any>;

const packs: Record<string, ProMessages> = {
  "zh-CN": zhCN as ProMessages,
  "en-US": enUS as ProMessages,
};

/** 当前语言（ConfigProvider 注入前也全局可用） */
const currentLocale = ref<ProLocale>("zh-CN");
/** 宿主自定义文案（与内置包深合并后生效） */
const customMessages = ref<ProMessages | null>(null);

function resolvePack(locale: ProLocale): ProMessages {
  const base = packs[locale] ?? packs["zh-CN"];
  const extra = customMessages.value;
  if (!extra) return base;
  // 浅层树合并足够：消息树只有两层
  return mergeMessages(base, extra);
}

function mergeMessages(base: ProMessages, extra: ProMessages): ProMessages {
  const out: ProMessages = { ...base };
  for (const key of Object.keys(extra)) {
    const b = out[key];
    const e = extra[key];
    out[key] =
      b && e && typeof b === "object" && typeof e === "object"
        ? mergeMessages(b, e)
        : e;
  }
  return out;
}

/** 按点路径取值；命中不了返回 key 本身（方便发现缺键） */
function lookup(pack: ProMessages, key: string): string | undefined {
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

/** 翻译函数：key 未命中时回退 zh-CN，再回退 key 本身 */
export function createTranslator(locale: MaybeRef<ProLocale>, overrides?: MaybeRef<ProMessages | null>) {
  return (key: string, params?: Record<string, unknown>): string => {
    const loc = unref(locale);
    const extra = unref(overrides);
    const merged =
      extra && Object.keys(extra).length
        ? mergeMessages(packs[loc] ?? packs["zh-CN"], extra)
        : (packs[loc] ?? packs["zh-CN"]);
    const hit = lookup(merged, key) ?? lookup(packs["zh-CN"], key);
    return interpolate(hit ?? key, params);
  };
}

/** 全局翻译（无 Provider 上下文时使用全局语言状态） */
export const $t = (key: string, params?: Record<string, unknown>): string =>
  createTranslator(currentLocale, customMessages)(key, params);

const globalTranslator = computed(() => createTranslator(currentLocale, customMessages));

/** vue-i18n 兼容形态：i18n.global.t */
export const i18n = {
  global: {
    t: (key: string, params?: Record<string, unknown>) => globalTranslator.value(key, params),
  },
};

/** 组件内使用：返回 { t }，与 vue-i18n 的 useI18n 同形 */
export function useI18n() {
  return { t: globalTranslator.value };
}

export function setProLocale(locale: ProLocale) {
  currentLocale.value = locale;
}

export function setProMessages(messages: ProMessages) {
  customMessages.value = messages;
}

export const localeRef = currentLocale;
