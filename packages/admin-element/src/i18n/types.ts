type LoadMessageFn = (lang: string) => Promise<Record<string, string> | undefined>;

interface LocaleSetupOptions {
  /**
   * Default language
   * @default zh-CN
   */
  defaultLocale?: string;
  /**
   * 语言包映射（lang -> 懒加载模块）：包内置 core 文案 + 宿主业务文案合并后传入，
   * 同名宿主覆盖。未传时仅用包内置框架文案。
   */
  localesMap?: Record<string, () => Promise<{ default: unknown }>>;
  /**
   * Load message function
   * @param lang
   * @returns
   */
  loadMessages?: LoadMessageFn;
  /**
   * Whether to warn when the key is not found
   */
  missingWarn?: boolean;
}

type ImportLocaleFn = () => Promise<{ default: Record<string, string> }>;

export type { LoadMessageFn, LocaleSetupOptions, ImportLocaleFn };
