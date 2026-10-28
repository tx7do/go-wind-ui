<template>
  <ElDialog
    :model-value="visible"
    width="600px"
    :close-on-click-modal="true"
    :show-close="false"
    :append-to-body="true"
    class="widgets-palette-dialog"
    @update:model-value="(v: boolean) => !v && close()"
    @open="onOpen"
  >
    <div class="widgets-palette" @keydown="onKeydown">
      <!-- 输入条：搜索图标 + 无边框输入 -->
      <div class="widgets-palette__inputbar">
        <span class="widgets-palette__icon" v-html="SEARCH_SVG" />
        <input
          ref="inputRef"
          v-model="keyword"
          type="text"
          class="widgets-palette__input"
          :placeholder="placeholder || t('widgets.palette.placeholder')"
          @keydown="onKeydown"
        />
        <kbd class="widgets-palette__kbd">Esc</kbd>
      </div>

      <!-- 结果区 -->
      <div ref="listRef" class="widgets-palette__results">
        <div v-if="filtered.length === 0" class="widgets-palette__empty">
          {{ t("widgets.palette.empty") }}
        </div>
        <template v-else>
          <template v-for="group in groupedFiltered" :key="group.key">
            <div v-if="group.label" class="widgets-palette__section">{{ group.label }}</div>
            <button
              v-for="item in group.items"
              :key="item.id"
              type="button"
              class="widgets-palette__item"
              :class="{ 'is-active': activeId === item.id }"
              :data-palette-id="item.id"
              @click="pick(item)"
              @mousemove="activeId = item.id"
            >
              <span v-if="item.icon" class="widgets-palette__item-icon" v-html="item.icon" />
              <span class="widgets-palette__item-label">{{ highlight(item.label) }}</span>
              <kbd v-if="item.hotkey" class="widgets-palette__kbd">{{ item.hotkey }}</kbd>
            </button>
          </template>
        </template>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
/**
 * 命令面板（Ctrl+K 全局搜索）纯 UI 件：命令项由宿主注入（菜单/路由/动作随宿主），
 * 本组件管搜索过滤、分组、键盘上下/回车/Esc、高亮。全局快捷键见 usePaletteHotkey。
 */
import { computed, nextTick, ref, watch } from "vue";
import { ElDialog } from "element-plus";
import { useWidgetsI18n } from "../locale";

export interface PaletteCommand {
  id: string;
  label: string;
  /** 分组 key（同一 key 的项归入同一段，groupLabels 提供段名） */
  group?: string;
  /** 内联 SVG 字符串（16×16 stroke 风格） */
  icon?: string;
  /** 搜索关键词（除 label 外的补充匹配） */
  keywords?: string;
  /** 展示用快捷键提示（如 "Ctrl+L"） */
  hotkey?: string;
  /** 附加数据（原样带回 select 事件） */
  payload?: unknown;
}

const props = withDefaults(
  defineProps<{
    visible: boolean;
    /** 全量命令（本组件内做关键词过滤） */
    commands?: PaletteCommand[];
    /** 分组 key → 段名 */
    groupLabels?: Record<string, string>;
    placeholder?: string;
  }>(),
  { commands: () => [], groupLabels: () => ({}) }
);

const emit = defineEmits<{
  "update:visible": [visible: boolean];
  select: [item: PaletteCommand];
  close: [];
}>();

const { t } = useWidgetsI18n();

const keyword = ref("");
const activeId = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);

const SEARCH_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';

const visible = computed(() => props.visible);

function close() {
  emit("update:visible", false);
  emit("close");
  keyword.value = "";
}

function onOpen() {
  keyword.value = "";
  void nextTick(() => inputRef.value?.focus());
}

// ============ 过滤 + 分组 ============
const filtered = computed<PaletteCommand[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return props.commands;
  return props.commands.filter(
    (c) =>
      c.label.toLowerCase().includes(kw) ||
      (c.keywords ?? "").toLowerCase().includes(kw)
  );
});

const groupedFiltered = computed(() => {
  const groups = new Map<string, PaletteCommand[]>();
  for (const item of filtered.value) {
    const key = item.group ?? "__default";
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()].map(([key, items]) => ({
    key,
    label: key === "__default" ? "" : props.groupLabels[key] ?? key,
    items,
  }));
});

// 过滤结果变化时激活项回到首个
watch(filtered, () => {
  activeId.value = filtered.value[0]?.id ?? "";
});

watch(visible, (v) => {
  if (v) {
    activeId.value = props.commands[0]?.id ?? "";
    void nextTick(() => inputRef.value?.focus());
  }
});

// ============ 键盘导航 ============
function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
  event.preventDefault();
  const list = filtered.value;
  if (!list.length) return;
  const idx = list.findIndex((c) => c.id === activeId.value);
  if (event.key === "ArrowDown") {
    activeId.value = list[Math.min(idx + 1, list.length - 1)].id;
  } else if (event.key === "ArrowUp") {
    activeId.value = list[Math.max(idx - 1, 0)].id;
  } else {
    const hit = list[idx] ?? list[0];
    if (hit) pick(hit);
    return;
  }
  void nextTick(() => {
    listRef.value
      ?.querySelector(`[data-palette-id="${CSS.escape(activeId.value)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  });
}

function pick(item: PaletteCommand) {
  emit("select", item);
  close();
}

/** 关键词高亮（命中段加粗，纯文本操作不引 HTML） */
function highlight(label: string): string {
  const kw = keyword.value.trim();
  if (!kw) return label;
  const idx = label.toLowerCase().indexOf(kw.toLowerCase());
  if (idx < 0) return label;
  return (
    label.slice(0, idx) +
    "【" +
    label.slice(idx, idx + kw.length) +
    "】" +
    label.slice(idx + kw.length)
  );
}
</script>

<style>
/* 弹层样式全局（append-to-body 渲染在组件树外） */
.widgets-palette-dialog .el-dialog__header {
  display: none;
}

.widgets-palette-dialog .el-dialog__body {
  padding: 0;
}
</style>

<style scoped>
.widgets-palette {
  display: flex;
  flex-direction: column;
}

.widgets-palette__inputbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.widgets-palette__icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
  color: var(--el-text-color-secondary, #9ca3af);
}

.widgets-palette__icon :deep(svg),
.widgets-palette__item-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.widgets-palette__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--el-text-color-primary, #1f2937);
  background: transparent;
}

.widgets-palette__input::placeholder {
  color: var(--el-text-color-placeholder, #c0c4cc);
}

.widgets-palette__kbd {
  padding: 2px 6px;
  font-size: 11px;
  line-height: 16px;
  color: var(--el-text-color-secondary, #9ca3af);
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 4px;
}

.widgets-palette__results {
  max-height: 360px;
  min-height: 120px;
  padding: 6px 0;
  overflow: auto;
}

.widgets-palette__section {
  padding: 8px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #9ca3af);
}

.widgets-palette__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 16px;
  font-size: 13px;
  text-align: left;
  color: var(--el-text-color-primary, #1f2937);
  background: transparent;
  border: none;
  cursor: pointer;
}

.widgets-palette__item.is-active,
.widgets-palette__item:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}

.widgets-palette__item-icon {
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--el-text-color-secondary, #6b7280);
}

.widgets-palette__item-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widgets-palette__empty {
  padding: 40px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary, #9ca3af);
  text-align: center;
}
</style>
