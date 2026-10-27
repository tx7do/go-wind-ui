import { isDarkMode as envIsDarkMode } from './env';

/**
 * 是否是暗黑模式：html.dark class 优先，其次系统偏好。
 * 组件内的 MutationObserver 跟踪保持不变，回调里读本函数即可。
 */
export function isDarkMode(): boolean {
  return envIsDarkMode();
}
