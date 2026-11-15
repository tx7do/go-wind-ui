import { createI18n, Locale } from "vue-i18n";
import { App } from "vue";

import type { LoadMessageFn, LocaleSetupOptions } from "./types";
import { loadLocalesMap, loadLocalesMapFromDir } from "./utils";
import { coreLocaleModules } from "../locales";

const i18n = createI18n({
  globalInjection: true,
  legacy: false,
  locale: "",
  messages: {},
});

/**
 * 语言包映射（lang -> 懒加载模块），由宿主在 setupI18n 时注入：
 * 包内置框架文案（coreLocaleModules）与宿主业务文案合并后传入（同名宿主覆盖）。
 * 包内不读 import.meta.glob 扫宿主目录——lib 构建下宿主目录不可见。
 */
let localesMap: Record<string, () => Promise<{ default: unknown }>> = { ...coreLocaleModules };
// 必须声明即赋默认值：initPreferences 在 setupI18n 之前运行，其 handleUpdates 会
// 因 app.locale 存在而调用 loadLocaleMessages；若此处是 undefined，
// 冷启动（尤其已登录刷新，refreshToken 网络往返拉长了时序窗口）会随机抛出
// "Uncaught (in promise) TypeError: loadMessages is not a function"（setup.ts loadLocaleMessages）。
let loadMessages: LoadMessageFn = async () => ({});

/**
 * Set i18n language
 * @param locale
 */
function setI18nLanguage(locale: Locale) {
  i18n.global.locale.value = locale;

  document?.querySelector("html")?.setAttribute("lang", locale);
}

async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  const { defaultLocale = "zh-CN" } = options;
  // 宿主语言包映射注入（包 core 文案 + 宿主业务文案合并；同名宿主覆盖）
  if (options.localesMap) {
    localesMap = { ...coreLocaleModules, ...options.localesMap };
  }
  // app可以自行扩展一些第三方库和组件库的国际化
  loadMessages = options.loadMessages || (async () => ({}));
  app.use(i18n);
  await loadLocaleMessages(defaultLocale);

  // 在控制台打印警告
  i18n.global.setMissingHandler((locale, key) => {
    if (options.missingWarn && key.includes(".")) {
      console.warn(`[intlify] Not found '${key}' key in '${locale}' locale messages.`);
    }
  });
}

async function loadLocaleMessages(lang: string) {
  // 将应用语言值转换为语言文件目录名（zh-CN -> zh-CN, en-US -> en-US）
  const langDir = lang;

  // 注意：这里不能做"locale 已相同则 early-return"的短路——initPreferences 会先于
  // setupI18n 触发一次加载（当时 localesMap 还是仅含包内置 core 文案的兜底），
  // setupI18n 注入宿主合并资源后若因同语言短路跳过加载，业务命名空间将永远缺失
  //（页面整片显示原始 key）。加载本身幂等（setLocaleMessage 全量覆盖），始终执行。
  const message = await localesMap[langDir]?.() as { default?: unknown } | undefined;

  if (message?.default) {
    // 设置语言包（先清空再设置，确保完全替换）
    i18n.global.setLocaleMessage(lang, message.default);
  } else {
    console.error(`[intlify] Failed to load '${lang}' locale messages.`);
  }

  const mergeMessage = await loadMessages(lang);
  if (mergeMessage && Object.keys(mergeMessage).length > 0) {
    i18n.global.mergeLocaleMessage(lang, mergeMessage);
  }

  return setI18nLanguage(lang);
}

/**
 * 翻译路由标题
 * 用于面包屑、侧边栏、标签页等场景
 * @param title 翻译键（如 "routes.dashboard.title"）
 */
function translateRouteTitle(title: string): string {
  if (!title) return "";
  // 直接尝试翻译，如果不存在则返回原文
  if (i18n.global.te(title)) return i18n.global.t(title);
  // 后端菜单种子键带 menu./page. 前缀，而本端路由文案都在 routes 命名空间下
  // 按去前缀的嵌套键存放（menu.ai.moduleName → routes.ai.moduleName），换前缀再查
  const prefixed = title.replace(/^(menu|page)\./, "routes.");
  if (prefixed !== title && i18n.global.te(prefixed)) return i18n.global.t(prefixed);
  return title;
}

// 显式注解：declaration emit 需要可移植类型（@intlify/core-base 不在包对外依赖面）
const $t: (typeof i18n.global)["t"] = i18n.global.t;
const $te: (typeof i18n.global)["te"] = i18n.global.te;

export {
  $t,
  $te,
  i18n,
  loadLocaleMessages,
  loadLocalesMap,
  loadLocalesMapFromDir,
  setupI18n,
  translateRouteTitle,
};

export { useI18n } from "vue-i18n";

export type { Locale } from "vue-i18n";
