<template>
  <div
    class="tiptap-statusbar absolute bottom-3 right-4 flex items-center gap-2 text-xs select-none pointer-events-none"
  >
    <span>{{ statusInfo.words }} {{ $t("editor.words") }}</span>
    <span class="statusbar-sep">|</span>
    <span>{{ statusInfo.chars }} {{ $t("editor.chars") }}</span>
    <span class="statusbar-sep">|</span>
    <span>Ln {{ statusInfo.cursor }}</span>
    <span class="statusbar-badge px-2 py-0.5 text-[11px] rounded">MD</span>
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
.tiptap-statusbar {
  color: var(--tte-text-muted);
}

.statusbar-sep {
  color: var(--tte-statusbar-border);
}

.statusbar-badge {
  color: var(--tte-text-muted);
  background-color: var(--tte-code-bg);
}
</style>
