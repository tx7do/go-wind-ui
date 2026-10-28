import { useState } from "react";
import { Radio } from "antd";
import { ChatMessages, ChatInput, useChat } from "@go-wind-ui/chat-react";

// 模拟流式传输（真实场景走 fetch stream / SSE）
const transport = async ({ messages, signal, onChunk }: any) => {
  const last = messages[messages.length - 1]?.content ?? "";
  const reply = `关于「${last}」：\n\n这是一段**模拟流式回复**，验证 markdown 渲染与打字动画。\n\n- 要点一\n- 要点二\n\n\`\`\`ts\nconst ok: boolean = true;\n\`\`\``;
  for (const chunk of reply.match(/.{1,6}/gs) ?? []) {
    if (signal.aborted) throw new DOMException("aborted", "AbortError");
    await new Promise((r) => setTimeout(r, 30));
    onChunk(chunk);
  }
  return reply;
};

export default function ChatDemo() {
  const chat = useChat({ transport });

  return (
    <div className="chat-demo">
      <div className="chat-demo__hint">
        <Radio.Group disabled value="chat">
          <Radio.Button value="chat">chat-react</Radio.Button>
        </Radio.Group>
        <span className="chat-demo__tip">Enter 发送 / Shift+Enter 换行 / 流式时变停止钮</span>
      </div>
      <div className="chat-demo__main">
        <ChatMessages
          messages={chat.messages}
          streaming={chat.streaming}
          streamingText={chat.streamingText}
        />
        <ChatInput
          streaming={chat.streaming}
          onSend={(text) => void chat.send(text)}
          onStop={() => chat.abort()}
        />
      </div>
      {chat.error && <div className="chat-demo__error">{chat.error}</div>}
    </div>
  );
}
