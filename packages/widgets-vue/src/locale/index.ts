/**
 * widgets 文案：经 @go-wind-ui/locale 工厂建包内实例。
 * 键形 widgets.*；宿主经 setWidgetsLocale / setWidgetsMessages 接管。
 */
import { createLocaleStore } from "@go-wind-ui/locale";

const ZH = {
  widgets: {
    notice: {
      title: "通知",
      unreadCount: "{count} 条未读",
      markAllRead: "全部已读",
      empty: "暂无通知",
    },
    palette: {
      placeholder: "搜索菜单与命令",
      empty: "无匹配结果",
      recent: "最近使用",
      noHistory: "暂无使用记录",
      openSearch: "打开全局搜索",
    },
    theme: {
      toDark: "切换为暗色",
      toLight: "切换为亮色",
    },
    lockscreen: {
      unlock: "点击解锁",
      placeholder: "请输入锁屏密码",
      entry: "进入系统",
      backToLogin: "返回登录",
      back: "返回",
      wrongPassword: "密码错误，请重试",
      verifyFailed: "解锁失败",
    },
  },
};

const EN = {
  widgets: {
    notice: {
      title: "Notifications",
      unreadCount: "{count} unread",
      markAllRead: "Mark all read",
      empty: "No notifications",
    },
    palette: {
      placeholder: "Search menus and commands",
      empty: "No results",
      recent: "Recent",
      noHistory: "No history",
      openSearch: "Open global search",
    },
    theme: {
      toDark: "Switch to dark",
      toLight: "Switch to light",
    },
    lockscreen: {
      unlock: "Click to unlock",
      placeholder: "Enter lock password",
      entry: "Enter",
      backToLogin: "Back to login",
      back: "Back",
      wrongPassword: "Wrong password, try again",
      verifyFailed: "Unlock failed",
    },
  },
};

const store = createLocaleStore({ packs: { "zh-CN": ZH, "en-US": EN }, defaultLocale: "zh-CN" });

export function useWidgetsI18n() {
  return store.useI18n();
}

export function setWidgetsLocale(locale: "zh-CN" | "en-US") {
  store.setLocale(locale);
}

export function setWidgetsMessages(messages: Record<string, any> | null) {
  store.setMessages(messages);
}
