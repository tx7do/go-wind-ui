<template>
  <div class="tiptap-statusbar">
    <span>{{ statusInfo.words }} {{ $t("editor.words") }}</span>
    <span class="statusbar-sep">|</span>
    <span>{{ statusInfo.chars }} {{ $t("editor.chars") }}</span>
    <span class="statusbar-sep">|</span>
    <span>Ln {{ statusInfo.cursor }}</span>
    <span class="statusbar-badge">MD</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "../env";

const $t = useI18n().t;
defineProps<{
  isDark: boolean;
  statusInfo: { chars: number; words: number; cursor: string };
}>();
</script>

<style scoped>
/* 定位/排版自包含：库不能假设宿主装了 Tailwind（此前用 absolute bottom-3 right-4 等
   工具类，未装 Tailwind 的宿主上这些类不生成，状态栏会落到编辑器顶部）。
   绝对定位锚点是 .tiptap-editor-wrapper（其 position: relative 在 tiptap.scss 里）。 */
.tiptap-statusbar {
  position: absolute;
  right: 16px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 1;
  color: var(--tte-text-muted);
  user-select: none;
  pointer-events: none;
}

.statusbar-sep {
  color: var(--tte-statusbar-border);
}

.statusbar-badge {
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  color: var(--tte-text-muted);
  background-color: var(--tte-code-bg);
}
</style>
