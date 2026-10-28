<template>
  <div class="chat-input">
    <textarea
      ref="inputRef"
      v-model="text"
      class="chat-input__textarea"
      rows="1"
      :placeholder="placeholder || t('chat.inputPlaceholder')"
      :disabled="disabled"
      @input="autoGrow"
      @keydown.enter.exact.prevent="submit"
    />
    <!-- 流式中显示停止钮，否则发送钮 -->
    <button
      v-if="streaming"
      type="button"
      class="chat-input__btn chat-input__btn--stop"
      :title="t('chat.stop')"
      @click="emit('stop')"
    >
      <span class="chat-input__stop-square" />
    </button>
    <button
      v-else
      type="button"
      class="chat-input__btn chat-input__btn--send"
      :disabled="disabled || !text.trim()"
      :title="t('chat.sendFailed')"
      @click="submit"
    >
      <span v-html="SEND_SVG" />
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 聊天输入框：自动增高、Enter 发送 / Shift+Enter 换行、流式时变停止钮。
 */
import { nextTick, ref } from "vue";
import { useChatI18n } from "./locale";

withDefaults(
  defineProps<{
    disabled?: boolean;
    streaming?: boolean;
    placeholder?: string;
  }>(),
  { disabled: false, streaming: false, placeholder: "" }
);

const emit = defineEmits<{ send: [text: string]; stop: [] }>();

const { t } = useChatI18n();
const text = ref("");
const inputRef = ref<HTMLTextAreaElement | null>(null);

const SEND_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';

function autoGrow() {
  const el = inputRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
}

function submit() {
  const value = text.value.trim();
  if (!value) return;
  emit("send", value);
  text.value = "";
  void nextTick(autoGrow);
}
</script>

<style scoped>
.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  background: var(--el-bg-color, #fff);
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.chat-input__textarea {
  flex: 1;
  min-height: 34px;
  max-height: 140px;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary, #1f2937);
  background: var(--el-fill-color-light, #f5f7fa);
  border: none;
  border-radius: 8px;
  outline: none;
  resize: none;
  box-sizing: border-box;
}

.chat-input__textarea:disabled {
  opacity: 0.6;
}

.chat-input__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.chat-input__btn--send {
  color: #fff;
  background: var(--el-color-primary, #409eff);
}

.chat-input__btn--send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chat-input__btn--send:not(:disabled):hover {
  background: var(--el-color-primary-light-3, #79bbff);
}

.chat-input__btn--send svg {
  width: 16px;
  height: 16px;
}

.chat-input__btn--stop {
  color: var(--el-color-danger, #f56c6c);
  background: var(--el-color-danger-light-9, #fef0f0);
}

.chat-input__stop-square {
  width: 10px;
  height: 10px;
  background: currentcolor;
  border-radius: 2px;
}
</style>
