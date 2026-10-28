/**
 * Ctrl/Cmd+K 全局快捷键绑定：visibleRef 翻转。
 * 宿主把它接到自己的面板 visible 状态即可。
 */
import { onScopeDispose } from "vue";
import type { Ref } from "vue";

export function usePaletteHotkey(visibleRef: Ref<boolean>, enabled?: () => boolean): () => void {
  const handler = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
    if (enabled && !enabled()) return;
    event.preventDefault();
    visibleRef.value = !visibleRef.value;
  };
  window.addEventListener("keydown", handler);
  onScopeDispose(() => window.removeEventListener("keydown", handler));
  return () => window.removeEventListener("keydown", handler);
}
