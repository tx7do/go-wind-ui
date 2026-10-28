/**
 * chat 文案包（widgets 同款工厂）。
 */
import { createLocaleStore } from "@go-wind-ui/locale";

const ZH = {
  chat: {
    inputPlaceholder: "输入消息，Enter 发送，Shift+Enter 换行",
    stop: "停止生成",
    streaming: "正在生成…",
    sendFailed: "发送失败",
  },
};

const EN = {
  chat: {
    inputPlaceholder: "Type a message. Enter to send, Shift+Enter for newline",
    stop: "Stop generating",
    streaming: "Generating…",
    sendFailed: "Send failed",
  },
};

const store = createLocaleStore({ packs: { "zh-CN": ZH, "en-US": EN }, defaultLocale: "zh-CN" });

export function useChatI18n() {
  return store.useI18n();
}

export function setChatLocale(locale: "zh-CN" | "en-US") {
  store.setLocale(locale);
}

export function setChatMessages(messages: Record<string, any> | null) {
  store.setMessages(messages);
}
