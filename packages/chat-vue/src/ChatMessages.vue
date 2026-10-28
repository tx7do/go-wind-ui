<template>
  <div ref="listRef" class="chat-messages" @scroll="onScroll">
    <div
      v-for="msg in messages"
      :key="msg.id"
      class="chat-messages__row"
      :class="{ 'chat-messages__row--user': msg.role === 'user' }"
    >
      <div
        v-if="msg.role !== 'user'"
        class="chat-messages__avatar"
        v-html="BOT_SVG"
      />
      <div
        class="chat-messages__bubble"
        :class="{
          'chat-messages__bubble--user': msg.role === 'user',
          'chat-messages__bubble--error': msg.error,
        }"
      >
        <!-- 助手消息走 markdown（净化后渲染）；用户消息纯文本 -->
        <div
          v-if="msg.role !== 'user'"
          class="chat-messages__markdown"
          v-html="renderMarkdown(msg.content)"
        />
        <template v-else>
          {{ msg.content }}
        </template>
      </div>
    </div>

    <!-- 流式块：打字动画 -->
    <div v-if="streaming" class="chat-messages__row">
      <div class="chat-messages__avatar" v-html="BOT_SVG" />
      <div class="chat-messages__bubble chat-messages__bubble--streaming">
        <div class="chat-messages__markdown" v-html="renderMarkdown(streamingText)" />
        <span v-if="!streamingText" class="chat-messages__typing"><i /><i /><i /></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 消息列表：角色气泡（用户右/助手左）、markdown 净化渲染、
 * 流式块打字动画、新消息自动滚底（用户上滑后暂停，滚回底部恢复）。
 */
import { nextTick, onMounted, ref, watch } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import type { ChatMessage } from "./use-chat";

const props = withDefaults(
  defineProps<{
    messages: ChatMessage[];
    streaming?: boolean;
    streamingText?: string;
  }>(),
  { streaming: false, streamingText: "" }
);

const listRef = ref<HTMLElement | null>(null);
/** 用户主动上滑后不再自动滚底，滚回底部恢复 */
const stickToBottom = ref(true);

// GFM + 单行换行（聊天场景常见单换行段落）
marked.setOptions({ gfm: true, breaks: true });

function renderMarkdown(content: string): string {
  if (!content) return "";
  return DOMPurify.sanitize(marked.parse(content, { async: false }) as string);
}

const BOT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';

function onScroll() {
  const el = listRef.value;
  if (!el) return;
  stickToBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
}

function scrollToBottom() {
  if (!stickToBottom.value || !listRef.value) return;
  listRef.value.scrollTop = listRef.value.scrollHeight;
}

onMounted(scrollToBottom);

watch(
  () => [props.messages.length, props.streamingText] as const,
  () => {
    void nextTick(scrollToBottom);
  }
);
</script>

<style scoped>
.chat-messages {
  height: 100%;
  padding: 16px;
  overflow: auto;
  box-sizing: border-box;
}

.chat-messages__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
}

.chat-messages__row--user {
  flex-direction: row-reverse;
}

.chat-messages__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-radius: 50%;
}

.chat-messages__avatar :deep(svg) {
  width: 17px;
  height: 17px;
}

.chat-messages__bubble {
  max-width: 76%;
  padding: 9px 12px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--el-text-color-primary, #1f2937);
  background: var(--el-fill-color-light, #f4f4f5);
  border-radius: 10px;
  overflow-wrap: anywhere;
}

.chat-messages__row--user .chat-messages__bubble {
  color: #fff;
  background: var(--el-color-primary, #409eff);
  white-space: pre-wrap;
}

.chat-messages__bubble--error {
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}

.chat-messages__bubble--streaming {
  min-height: 34px;
}

/* markdown 排版（净化后渲染） */
.chat-messages__markdown :deep(p) {
  margin: 0 0 8px;
}

.chat-messages__markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-messages__markdown :deep(pre) {
  margin: 8px 0;
  padding: 10px;
  overflow: auto;
  font-size: 12px;
  background: var(--el-fill-color-darker, #e9e9eb);
  border-radius: 6px;
}

.chat-messages__row--user .chat-messages__markdown :deep(pre) {
  background: rgb(255 255 255 / 18%);
}

.chat-messages__markdown :deep(code) {
  padding: 1px 4px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  background: var(--el-fill-color-darker, #e9e9eb);
  border-radius: 3px;
}

.chat-messages__markdown :deep(table) {
  margin: 8px 0;
  border-collapse: collapse;
}

.chat-messages__markdown :deep(th),
.chat-messages__markdown :deep(td) {
  padding: 4px 8px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
}

/* 打字动画（三点） */
.chat-messages__typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 20px;
}

.chat-messages__typing i {
  width: 5px;
  height: 5px;
  background: var(--el-text-color-secondary, #909399);
  border-radius: 50%;
  animation: chat-typing 1.2s infinite ease-in-out;
}

.chat-messages__typing i:nth-child(2) {
  animation-delay: 0.2s;
}

.chat-messages__typing i:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes chat-typing {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
</style>
