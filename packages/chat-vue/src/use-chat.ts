/**
 * useChat —— 聊天状态机（框架内 composable）：消息流 + 流式块追加 + 中止。
 * 传输完全宿主注入：transport 收 { messages, signal, onChunk }，
 * 流式实现（fetch stream / SSE / WebSocket）是宿主的事。
 */
import { ref, shallowRef } from "vue";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  /** 出错标记：该条为失败占位 */
  error?: boolean;
}

export interface ChatTransportInput {
  messages: ChatMessage[];
  signal: AbortSignal;
  /** 流式块回调：增量文本 */
  onChunk: (chunk: string) => void;
}

export interface UseChatOptions {
  /** 传输函数（宿主注入：fetch stream / SSE / WebSocket 任选） */
  transport: (input: ChatTransportInput) => Promise<string>;
  /** 系统提示（作为首条 system 消息参与每次 transport 输入，不渲染） */
  systemPrompt?: string;
  /** 会话 id（多会话宿主自管；本 hook 只按单流管理） */
  id?: string;
}

let seq = 0;
function genId(): string {
  return `chat_${Date.now().toString(36)}_${(seq++).toString(36)}`;
}
/** 消息 id 生成器（宿主自行 addMessage 时可用） */
export const genChatId = genId;

export function useChat(options: UseChatOptions) {
  const messages = ref<ChatMessage[]>([]);
  const streaming = ref(false);
  const streamingText = ref("");
  const error = shallowRef<string | null>(null);

  let abortController: AbortController | null = null;

  /** 追加一条消息并返回其引用 */
  function push(role: ChatMessage["role"], content: string): ChatMessage {
    const msg: ChatMessage = { id: genId(), role, content };
    messages.value.push(msg);
    return msg;
  }

  /** 直接注入一条消息（宿主载入历史会话用） */
  function addMessage(role: ChatMessage["role"], content: string): ChatMessage {
    return push(role, content);
  }

  function clear() {
    if (streaming.value) abort();
    messages.value = [];
    streamingText.value = "";
    error.value = null;
  }

  function abort() {
    abortController?.abort();
    abortController = null;
    // 半截流式文本落为正式消息（不丢内容）
    if (streamingText.value) {
      push("assistant", streamingText.value);
      streamingText.value = "";
    }
    streaming.value = false;
  }

  /** 发送用户消息并驱动流式回复 */
  async function send(text: string, onDone?: (full: string) => void): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || streaming.value) return;

    error.value = null;
    push("user", trimmed);

    abortController = new AbortController();
    streaming.value = true;
    streamingText.value = "";

    const wire: ChatMessage[] = [
      ...(options.systemPrompt ? [{ id: "sys", role: "system" as const, content: options.systemPrompt }] : []),
      ...messages.value.filter((m) => m.role !== "system"),
    ];

    try {
      const full = await options.transport({
        messages: wire,
        signal: abortController.signal,
        onChunk: (chunk) => {
          streamingText.value += chunk;
        },
      });
      // 非 onChunk 式一次性返回也兼容
      streamingText.value = full || streamingText.value;
      push("assistant", streamingText.value);
      onDone?.(streamingText.value);
    } catch (err) {
      // AbortError 是用户主动停止，不算错误
      if ((err as Error)?.name === "AbortError") {
        if (streamingText.value) push("assistant", streamingText.value);
      } else {
        console.error("[chat] transport failed", err);
        error.value = err instanceof Error ? err.message : String(err);
        push("assistant", error.value);
        const last = messages.value[messages.value.length - 1];
        if (last) last.error = true;
      }
    } finally {
      streamingText.value = "";
      streaming.value = false;
      abortController = null;
    }
  }

  return {
    messages,
    streaming,
    streamingText,
    error,
    send,
    abort,
    clear,
    addMessage,
  };
}
