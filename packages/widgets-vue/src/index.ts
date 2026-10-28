/**
 * @go-wind/widgets-vue
 *
 * Admin 壳件套件（Vue 3 + Element Plus，纯展示、数据宿主注入）：
 * 通知铃铛 / 命令面板（Ctrl+K）/ 主题切换 / 语言选择。
 */
import "./styles/base.scss";

export { default as NoticeDropdown } from "./notice/NoticeDropdown.vue";
export type { WidgetsNoticeItem } from "./notice/NoticeDropdown.vue";
export { default as CommandPalette } from "./palette/CommandPalette.vue";
export type { PaletteCommand } from "./palette/CommandPalette.vue";
export { default as ThemeSwitch } from "./theme/ThemeSwitch.vue";
export { default as LangSelect } from "./lang/LangSelect.vue";
export type { WidgetsLangOption } from "./lang/LangSelect.vue";
export { default as LockScreen } from "./lockscreen/LockScreen.vue";

// 全局快捷键：Ctrl/Cmd+K 切换面板
export { usePaletteHotkey } from "./palette/hotkey";

// i18n（widgets.* 键包）
export { useWidgetsI18n, setWidgetsLocale, setWidgetsMessages } from "./locale";
