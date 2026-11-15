/**
 * 包内不读 import.meta.env——lib 构建会把它静态替换成"包构建时"的值，
 * 宿主开发环境的真实 DEV 态传不进来。因此包统一走运行时注入，
 * 由宿主在 bootstrap 阶段调用 configureAdminRuntime(...)。
 */
let devMode = false;
let apiBaseUrl = '';

export function configureAdminRuntime(options: { isDev?: boolean; apiBaseUrl?: string } = {}): void {
  devMode = Boolean(options.isDev);
  if (options.apiBaseUrl !== undefined) {
    apiBaseUrl = options.apiBaseUrl;
  }
}

/** 宿主是否处于开发环境（用于 dev-only 诊断告警，生产恒为 false） */
export function isDevMode(): boolean {
  return devMode;
}

/**
 * 宿主 API 基址（原 transport 的 VITE_API_URL，serverExportFile 拼绝对下载地址用；
 * 开发态为 '/' 相对路径走代理，生产态为独立 API 域）。缺省空串 = 同源相对路径。
 */
export function getApiBaseUrl(): string {
  return apiBaseUrl;
}
