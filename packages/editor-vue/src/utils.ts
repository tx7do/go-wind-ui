import { isDarkNow } from "./env";

/**
 * 是否是暗黑模式（非响应式读取；需要响应式请用 env 的 useEditorDark）
 */
export function isDarkMode(): boolean {
  return isDarkNow();
}
