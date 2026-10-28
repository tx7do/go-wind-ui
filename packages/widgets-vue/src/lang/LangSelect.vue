<template>
  <ElDropdown trigger="click" @command="(cmd) => pick(String(cmd))">
    <span class="widgets-lang-select">
      <span class="widgets-lang-select__icon" v-html="GLOBE_SVG" />
      <span class="widgets-lang-select__label">{{ currentLabel }}</span>
    </span>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem
          v-for="opt in options"
          :key="opt.value"
          :command="opt.value"
          :disabled="opt.value === modelValue"
        >
          {{ opt.label }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<script setup lang="ts">
/**
 * 语言选择（纯展示）：options/v-model 由宿主注入，change 上抛，
 * 宿主自己调 i18n/locale 体系。
 */
import { computed } from "vue";
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from "element-plus";

export interface WidgetsLangOption {
  value: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    options?: WidgetsLangOption[];
  }>(),
  { modelValue: "", options: () => [] }
);

const emit = defineEmits<{ "update:modelValue": [value: string]; change: [value: string] }>();

const currentLabel = computed(
  () => props.options.find((o) => o.value === props.modelValue)?.label ?? props.modelValue
);

const GLOBE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>';

function pick(value: string) {
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<style scoped>
.widgets-lang-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 8px;
  font-size: 13px;
  color: var(--el-text-color-primary, #1f2937);
  cursor: pointer;
  border-radius: 6px;
}

.widgets-lang-select:hover {
  background: var(--el-fill-color, #f0f2f5);
}

.widgets-lang-select__icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
}

.widgets-lang-select__icon :deep(svg) {
  width: 16px;
  height: 16px;
}
</style>
