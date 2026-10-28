/**
 * @go-wind-ui/chat-vue
 *
 * AI 流式聊天 UI（Vue 3）：useChat 状态机 + ChatMessages + ChatInput。
 * 传输函数宿主注入（fetch stream / SSE / WebSocket 任选）。
 */
import "./styles/base.scss";

export { useChat, genChatId } from "./use-chat";
export type { ChatMessage, ChatTransportInput, UseChatOptions } from "./use-chat";
export { default as ChatMessages } from "./ChatMessages.vue";
export { default as ChatInput } from "./ChatInput.vue";
export { useChatI18n, setChatLocale, setChatMessages } from "./locale";
