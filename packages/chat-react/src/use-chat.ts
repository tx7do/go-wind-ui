/**
 * useChat —— 聊天状态机（React hook）：消息流 + 流式块追加 + 中止。
 * 传输完全宿主注入：transport 收 { messages, signal, onChunk }。
 */
import { useCallback, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  error?: boolean;
}

export interface ChatTransportInput {
  messages: ChatMessage[];
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
}

export interface UseChatOptions {
  transport: (input: ChatTransportInput) => Promise<string>;
  systemPrompt?: string;
}

let seq = 0;
export function genChatId(): string {
  return `chat_${Date.now().toString(36)}_${(seq++).toString(36)}`;
}

export function useChat(options: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const push = useCallback((role: ChatMessage["role"], content: string) => {
    const msg: ChatMessage = { id: genChatId(), role, content };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const addMessage = useCallback(
    (role: ChatMessage["role"], content: string) => push(role, content),
    [push]
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setStreamingText("");
    setError(null);
    setStreaming(false);
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamingText((text) => {
      if (text) push("assistant", text);
      setStreaming(false);
      return "";
    });
  }, [push]);

  const send = useCallback(
    async (text: string, onDone?: (full: string) => void): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed || abortRef.current) return;

      setError(null);
      push("user", trimmed);

      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);
      setStreamingText("");

      const wire: ChatMessage[] = [
        ...(options.systemPrompt
          ? [{ id: "sys", role: "system" as const, content: options.systemPrompt }]
          : []),
        ...messagesRef.current.filter((m) => m.role !== "system"),
      ];

      try {
        const full = await options.transport({
          messages: wire,
          signal: controller.signal,
          onChunk: (chunk) => setStreamingText((prev) => prev + chunk),
        });
        let result = full;
        if (!result) {
          setStreamingText((prev) => {
            result = prev;
            return prev;
          });
        }
        push("assistant", result);
        onDone?.(result);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          setStreamingText((text) => {
            if (text) push("assistant", text);
            return "";
          });
        } else {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[chat] transport failed", err);
          setError(message);
          const msg = push("assistant", message);
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, error: true } : m)));
        }
      } finally {
        setStreamingText("");
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [options, push]
  );

  return { messages, streaming, streamingText, error, send, abort, clear, addMessage };
}
