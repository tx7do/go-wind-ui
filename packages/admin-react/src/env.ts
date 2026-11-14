/**
 * 包内不读 import.meta.env——lib 构建会把它静态替换成"包构建时"的值，
 * 宿主开发环境的真实 DEV 态传不进来。因此包统一走运行时注入的 dev 标志，
 * 由宿主在 bootstrap 阶段调用 configureAdminRuntime({ isDev: import.meta.env.DEV })。
 */
let devMode = false;

export function configureAdminRuntime(options: { isDev?: boolean } = {}): void {
  devMode = Boolean(options.isDev);
}

/** 宿主是否处于开发环境（用于 dev-only 诊断告警，生产恒为 false） */
export function isDevMode(): boolean {
  return devMode;
}
