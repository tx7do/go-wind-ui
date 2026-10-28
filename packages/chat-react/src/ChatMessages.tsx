/**
 * 消息列表：角色气泡、markdown 净化渲染、流式打字动画、自动滚底。
 */
import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import type { ChatMessage } from "./use-chat";

export interface ChatMessagesProps {
  messages: ChatMessage[];
  streaming?: boolean;
  streamingText?: string;
}

marked.setOptions({ gfm: true, breaks: true });

function renderMarkdown(content: string): string {
  if (!content) return "";
  return DOMPurify.sanitize(marked.parse(content, { async: false }) as string);
}

const BOT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';

const STYLES = {
  list: { height: "100%", padding: 16, overflowY: "auto" as const, boxSizing: "border-box" as const },
  row: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 },
  rowUser: { display: "flex", alignItems: "flex-start", flexDirection: "row-reverse" as const, gap: 10, marginBottom: 14 },
  avatar: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: 30,
    height: 30,
    color: "var(--el-color-primary, #409eff)",
    background: "var(--el-color-primary-light-9, #ecf5ff)",
    borderRadius: "50%",
  },
  avatarSvg: { width: 17, height: 17 },
  bubble: {
    maxWidth: "76%",
    padding: "9px 12px",
    fontSize: 13,
    lineHeight: 1.65,
    color: "var(--el-text-color-primary, #1f2937)",
    background: "var(--el-fill-color-light, #f4f4f5)",
    borderRadius: 10,
    overflowWrap: "anywhere" as const,
  },
  bubbleUser: { color: "#fff", background: "var(--el-color-primary, #409eff)", whiteSpace: "pre-wrap" as const },
  bubbleError: { color: "var(--el-color-danger, #f56c6c)", background: "var(--el-color-danger-light-9, #fef0f0)" },
  bubbleStreaming: { minHeight: 34 },
};

export function ChatMessages(props: ChatMessagesProps) {
  const { messages, streaming, streamingText } = props;
  const listRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setStickToBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  };

  useEffect(() => {
    if (stickToBottom && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, streamingText, stickToBottom]);

  return (
    <div ref={listRef} style={STYLES.list} onScroll={onScroll} className="chat-messages">
      {messages.map((msg) => (
        <div key={msg.id} style={msg.role === "user" ? STYLES.rowUser : STYLES.row}>
          {msg.role !== "user" && (
            <div style={STYLES.avatar} dangerouslySetInnerHTML={{ __html: BOT_SVG }} />
          )}
          <div
            style={{
              ...STYLES.bubble,
              ...(msg.role === "user" ? STYLES.bubbleUser : {}),
              ...(msg.error ? STYLES.bubbleError : {}),
            }}
          >
            {msg.role !== "user" ? (
              <div
                className="chat-messages__markdown"
                style={{ width: "100%" }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
            ) : (
              msg.content
            )}
          </div>
        </div>
      ))}

      {streaming && (
        <div style={STYLES.row}>
          <div style={STYLES.avatar} dangerouslySetInnerHTML={{ __html: BOT_SVG }} />
          <div style={{ ...STYLES.bubble, ...STYLES.bubbleStreaming }}>
            <div
              className="chat-messages__markdown"
              style={{ width: "100%" }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText ?? "") }}
            />
            {!streamingText && (
              <span className="chat-messages__typing">
                <i /><i /><i />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
