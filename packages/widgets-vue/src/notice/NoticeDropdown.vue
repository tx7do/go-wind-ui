<template>
  <ElDropdown trigger="click" @visible-change="(v) => v && emit('open')">
    <div class="widgets-notice__trigger">
      <ElBadge v-if="unreadCount > 0" :value="unreadCount" :max="99">
        <span class="widgets-notice__bell" v-html="BELL_SVG" />
      </ElBadge>
      <span v-else class="widgets-notice__bell" v-html="BELL_SVG" />
    </div>
    <template #dropdown>
      <div class="widgets-notice">
        <!-- 头部：标题 + 未读数 + 全部已读 -->
        <div class="widgets-notice__header">
          <span class="widgets-notice__heading">
            {{ t("widgets.notice.title") }}
            <span v-if="unreadCount > 0" class="widgets-notice__unread">
              {{ t("widgets.notice.unreadCount", { count: unreadCount }) }}
            </span>
          </span>
          <ElButton
            text
            type="primary"
            size="small"
            :loading="markAllLoading"
            :disabled="unreadCount <= 0"
            @click="emit('read-all')"
          >
            {{ t("widgets.notice.markAllRead") }}
          </ElButton>
        </div>

        <!-- 列表：未读圆点 + 标题 + 摘要 -->
        <div v-loading="loading" class="widgets-notice__body">
          <template v-if="items.length > 0">
            <div
              v-for="item in items"
              :key="item.id"
              class="widgets-notice__item"
              @click="emit('item-click', item)"
            >
              <span class="widgets-notice__dot" :class="{ 'is-unread': item.unread }" />
              <div class="widgets-notice__main">
                <div class="widgets-notice__item-title" :class="{ 'is-unread': item.unread }">
                  {{ item.title || "-" }}
                </div>
                <div v-if="stripHtml(item.content)" class="widgets-notice__excerpt">
                  {{ stripHtml(item.content) }}
                </div>
              </div>
              <slot name="item-extra" :item="item" />
            </div>
          </template>
          <div v-else class="widgets-notice__empty">{{ t("widgets.notice.empty") }}</div>
        </div>

        <slot name="footer" />
      </div>
    </template>
  </ElDropdown>
</template>

<script setup lang="ts">
/**
 * 通知铃铛（纯展示件）：数据全由宿主注入（SSE/轮询/接口都随宿主），
 * 本组件只管铃铛角标 + 下拉列表 + 全部已读交互。
 */
import { ElBadge, ElButton, ElDropdown } from "element-plus";
import { useWidgetsI18n } from "../locale";

export interface WidgetsNoticeItem {
  id: string | number;
  title?: string;
  content?: string;
  unread?: boolean;
}

withDefaults(
  defineProps<{
    items?: WidgetsNoticeItem[];
    unreadCount?: number;
    loading?: boolean;
    markAllLoading?: boolean;
  }>(),
  { items: () => [], unreadCount: 0, loading: false, markAllLoading: false }
);

const emit = defineEmits<{
  "item-click": [item: WidgetsNoticeItem];
  "read-all": [];
  /** 下拉展开（宿主在此拉取最新列表） */
  open: [];
}>();

const { t } = useWidgetsI18n();

const BELL_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';

/** 摘要剥离 HTML 标签（通知内容常带富文本） */
function stripHtml(content?: string): string {
  if (!content) return "";
  return content.replace(/<[^>]*>/g, "").trim();
}
</script>

<style scoped>
.widgets-notice__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 6px;
  cursor: pointer;
  border-radius: 6px;
}

.widgets-notice__trigger:hover {
  background: var(--el-fill-color, #f0f2f5);
}

.widgets-notice__bell {
  display: inline-flex;
  width: 18px;
  height: 18px;
  color: var(--el-text-color-primary, #1f2937);
}

.widgets-notice__bell :deep(svg) {
  width: 18px;
  height: 18px;
}

.widgets-notice {
  width: 320px;
}

.widgets-notice__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.widgets-notice__heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2937);
}

.widgets-notice__unread {
  font-size: 11px;
  font-weight: 400;
  color: var(--el-color-danger, #f56c6c);
}

.widgets-notice__body {
  max-height: 320px;
  min-height: 80px;
  overflow: auto;
}

.widgets-notice__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
}

.widgets-notice__item:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}

.widgets-notice__dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  margin-top: 6px;
  background: transparent;
  border-radius: 50%;
}

.widgets-notice__dot.is-unread {
  background: var(--el-color-danger, #f56c6c);
}

.widgets-notice__main {
  flex: 1;
  min-width: 0;
}

.widgets-notice__item-title {
  font-size: 13px;
  color: var(--el-text-color-regular, #4b5563);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widgets-notice__item-title.is-unread {
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2937);
}

.widgets-notice__excerpt {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #9ca3af);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.widgets-notice__empty {
  padding: 28px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary, #9ca3af);
  text-align: center;
}
</style>
