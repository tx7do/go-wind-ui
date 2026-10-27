import { computed, ref, unref } from "vue";
import type { MaybeRef, Ref } from "vue";

export type LocaleKey = string;
export type LocaleMessages = Record<string, any>;

function mergeMessages(base: LocaleMessages, extra: LocaleMessages): LocaleMessages {
  const out: LocaleMessages = { ...base };
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

/** 按点路径取值；命中不了返回 undefined */
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

export type Translator = (key: string, params?: Record<string, unknown>) => string;

export interface LocaleStoreOptions {
  /** 内置语言包，键为 locale 标识（如 "zh-CN"） */
  packs: Record<LocaleKey, LocaleMessages>;
  /** 缺省语言，必须存在于 packs */
  defaultLocale: LocaleKey;
  /** 宿主自定义文案（与内置包深合并），可随时更换 */
  messages?: LocaleMessages | null;
}

export interface LocaleStore {
  /** 当前语言（全局单例语义：所有同 store 消费方共享） */
  localeRef: Ref<LocaleKey>;
  setLocale: (locale: LocaleKey) => void;
  setMessages: (messages: LocaleMessages | null) => void;
  /** 全局翻译函数（跟随 store 当前语言） */
  t: Translator;
  /** vue-i18n 兼容形态：i18n.global.t */
  i18n: { global: { t: Translator } };
  /** 组件内使用：返回 { t }，与 vue-i18n 的 useI18n 同形 */
  useI18n: () => { t: Translator };
  /** 创建绑定指定语言的翻译器（Provider 作用域覆盖用） */
  createTranslator: (
    locale: MaybeRef<LocaleKey>,
    overrides?: MaybeRef<LocaleMessages | null>
  ) => Translator;
}

/**
 * 创建一个语言包 store。每个 go-wind-ui 包各自持有一个实例，
 * 互不干扰；同一包内的所有组件共享同一份当前语言状态。
 */
export function createLocaleStore(options: LocaleStoreOptions): LocaleStore {
  const { packs, defaultLocale } = options;
  const currentLocale = ref<LocaleKey>(defaultLocale);
  const customMessages = ref<LocaleMessages | null>(options.messages ?? null);

  const translator = computed<Translator>(() => {
    const loc = currentLocale.value;
    const extra = customMessages.value;
    const base = packs[loc] ?? packs[defaultLocale];
    const merged =
      extra && Object.keys(extra).length ? mergeMessages(base, extra) : base;
    return (key, params) => {
      const hit = lookup(merged, key) ?? lookup(packs[defaultLocale], key);
      return interpolate(hit ?? key, params);
    };
  });

  const t: Translator = (key, params) => translator.value(key, params);

  return {
    localeRef: currentLocale,
    setLocale: (locale) => {
      currentLocale.value = locale;
    },
    setMessages: (messages) => {
      customMessages.value = messages;
    },
    t,
    i18n: { global: { t } },
    useI18n: () => ({ t }),
    createTranslator: (locale, overrides) => {
      return (key, params) => {
        const loc = unref(locale);
        const extra = unref(overrides);
        const base = packs[loc] ?? packs[defaultLocale];
        const merged =
          extra && Object.keys(extra).length ? mergeMessages(base, extra) : base;
        const hit = lookup(merged, key) ?? lookup(packs[defaultLocale], key);
        return interpolate(hit ?? key, params);
      };
    },
  };
}
