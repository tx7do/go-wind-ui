<template>
  <button
    type="button"
    class="widgets-theme-switch"
    :title="dark ? t('widgets.theme.toLight') : t('widgets.theme.toDark')"
    @click="toggle"
  >
    <!-- 太阳（亮色态显示）/ 月亮（暗色态显示）内联 SVG，尺寸过渡旋转 -->
    <span class="widgets-theme-switch__icon" :class="{ 'is-dark': dark }" v-html="dark ? MOON_SVG : SUN_SVG" />
  </button>
</template>

<script setup lang="ts">
/**
 * 主题切换钮（纯展示）：v-model:dark + change(dark) 上抛，
 * 宿主自己落 html.dark / VxeUI.setTheme / 偏好持久化。
 */
import { useWidgetsI18n } from "../locale";

const props = withDefaults(defineProps<{ dark?: boolean }>(), { dark: false });
const emit = defineEmits<{ "update:dark": [dark: boolean]; change: [dark: boolean] }>();

const { t } = useWidgetsI18n();

const SUN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
const MOON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

function toggle() {
  const next = !props.dark;
  emit("update:dark", next);
  emit("change", next);
}
</script>

<style scoped>
.widgets-theme-switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--el-text-color-primary, #1f2937);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.widgets-theme-switch:hover {
  background: var(--el-fill-color, #f0f2f5);
}

.widgets-theme-switch__icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
  transition: transform 0.3s;
}

.widgets-theme-switch__icon.is-dark {
  transform: rotate(-30deg);
}

.widgets-theme-switch__icon :deep(svg) {
  width: 18px;
  height: 18px;
}
</style>
