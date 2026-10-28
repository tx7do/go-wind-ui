/**
 * @go-wind/chat-react
 *
 * AI 流式聊天 UI（React 19）：useChat 状态机 + ChatMessages + ChatInput。
 * 传输函数宿主注入（fetch stream / SSE / WebSocket 任选）。
 */
import "./styles.css";

export { useChat, genChatId } from "./use-chat";
export type { ChatMessage, ChatTransportInput, UseChatOptions } from "./use-chat";
export { ChatMessages } from "./ChatMessages";
export type { ChatMessagesProps } from "./ChatMessages";
export { ChatInput } from "./ChatInput";
export type { ChatInputProps } from "./ChatInput";
