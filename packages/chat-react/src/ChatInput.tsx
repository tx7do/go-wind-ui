/**
 * 聊天输入框：自动增高、Enter 发送 / Shift+Enter 换行、流式时变停止钮。
 */
import { useRef, useState } from "react";

export interface ChatInputProps {
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
  onSend?: (text: string) => void;
  onStop?: () => void;
}

const SEND_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';

export function ChatInput(props: ChatInputProps) {
  const { disabled, streaming, placeholder, onSend, onStop } = props;
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const autoGrow = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    onSend?.(value);
    setText("");
    setTimeout(autoGrow, 0);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="chat-input"
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        padding: "10px 12px",
        background: "var(--el-bg-color, #fff)",
        borderTop: "1px solid var(--el-border-color-lighter, #ebeef5)",
      }}
    >
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          autoGrow();
        }}
        onKeyDown={onKeyDown}
        rows={1}
        disabled={disabled}
        placeholder={placeholder ?? "Type a message. Enter to send, Shift+Enter for newline"}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 34,
          maxHeight: 140,
          padding: "8px 10px",
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--el-text-color-primary, #1f2937)",
          background: "var(--el-fill-color-light, #f5f7fa)",
          border: "none",
          borderRadius: 8,
          outline: "none",
          resize: "none",
          boxSizing: "border-box",
          opacity: disabled ? 0.6 : 1,
        }}
      />
      {streaming ? (
        <button
          type="button"
          title="Stop generating"
          onClick={() => onStop?.()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: 34,
            height: 34,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            color: "var(--el-color-danger, #f56c6c)",
            background: "var(--el-color-danger-light-9, #fef0f0)",
          }}
        >
          <span style={{ width: 10, height: 10, background: "currentcolor", borderRadius: 2 }} />
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled || !text.trim()}
          onClick={submit}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: 34,
            height: 34,
            border: "none",
            borderRadius: 8,
            cursor: disabled || !text.trim() ? "not-allowed" : "pointer",
            opacity: disabled || !text.trim() ? 0.45 : 1,
            color: "#fff",
            background: "var(--el-color-primary, #409eff)",
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: SEND_SVG }} style={{ display: "inline-flex", width: 16, height: 16 }} />
        </button>
      )}
    </div>
  );
}
