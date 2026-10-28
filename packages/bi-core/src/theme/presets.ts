/**
 * 仪表盘主题预设（大屏主题库）：
 * - 空键 / "auto"：跟随宿主亮暗（现状行为）
 * - 具名预设：把图表配色模式与卡片/画布外观"钉死"——宿主无论亮暗，
 *   仪表盘都按预设渲染（大屏的核心诉求）。
 * 卡片外观经 CSS 变量 --bi-card-* 下发，两端渲染器同链消费。
 */

import type { BiResolvedTheme } from "./index";
import { resolveTheme } from "./index";

export interface BiDashboardThemePreset {
  key: string;
  /** 中文名（设计器下拉展示） */
  name: string;
  nameEn: string;
  /** 图表色彩模式：预设钉死，不再跟随宿主亮暗 */
  mode: "light" | "dark";
  palette?: string[];
  /** 仪表盘画布底色 */
  canvasBg?: string;
  cardBg?: string;
  cardBorder?: string;
  cardTitle?: string;
}

export const BI_DASHBOARD_THEMES: Record<string, BiDashboardThemePreset> = {
  "tech-blue": {
    key: "tech-blue",
    name: "科技蓝·大屏",
    nameEn: "Tech Blue",
    mode: "dark",
    palette: [
      "#3ea6ff", "#00e0c6", "#7c8cff", "#ffd166", "#ff6b8a",
      "#00b8d9", "#9d7bff", "#38d982", "#ff9f43", "#5ad8f0",
    ],
    canvasBg: "#050e1f",
    cardBg: "rgba(10, 28, 58, 0.88)",
    cardBorder: "rgba(64, 169, 255, 0.38)",
    cardTitle: "#d6f0ff",
  },
  "midnight-violet": {
    key: "midnight-violet",
    name: "午夜紫·大屏",
    nameEn: "Midnight Violet",
    mode: "dark",
    palette: [
      "#9d7bff", "#ff6b8a", "#5ad8f0", "#ffd166", "#7cf29c",
      "#c77dff", "#4cc9f0", "#ff9e6d", "#b892ff", "#6ef3d6",
    ],
    canvasBg: "#0d0821",
    cardBg: "rgba(30, 21, 66, 0.88)",
    cardBorder: "rgba(157, 123, 255, 0.4)",
    cardTitle: "#e8deff",
  },
  "aurora-teal": {
    key: "aurora-teal",
    name: "极光青·大屏",
    nameEn: "Aurora Teal",
    mode: "dark",
    palette: [
      "#00e0c6", "#38d982", "#4cc9f0", "#a7f3d0", "#ffd166",
      "#059fb0", "#7cf29c", "#36cfc9", "#94e3ff", "#2b9348",
    ],
    canvasBg: "#041f1e",
    cardBg: "rgba(6, 51, 48, 0.88)",
    cardBorder: "rgba(0, 224, 198, 0.35)",
    cardTitle: "#d0fff8",
  },
  graphite: {
    key: "graphite",
    name: "石墨灰·大屏",
    nameEn: "Graphite",
    mode: "dark",
    palette: [
      "#8ab4f8", "#a8adb8", "#c7ccd6", "#6f7885", "#dfe3e8",
      "#5f8dd3", "#98a1ab", "#b0b8c2", "#7d8590", "#9aa5b1",
    ],
    canvasBg: "#111318",
    cardBg: "rgba(26, 29, 36, 0.9)",
    cardBorder: "rgba(200, 204, 211, 0.22)",
    cardTitle: "#e8eaed",
  },
  paper: {
    key: "paper",
    name: "清晨·浅色",
    nameEn: "Morning Paper",
    mode: "light",
    palette: [
      "#409eff", "#67c23a", "#e6a23c", "#f56c6c", "#909399",
      "#36cfc9", "#722ed1", "#fa8c16", "#13c2c2", "#eb2f96",
    ],
    canvasBg: "#eef2f7",
    cardBg: "#ffffff",
    cardBorder: "#e4e9f0",
    cardTitle: "#1f2937",
  },
};

export const BI_THEME_PRESET_KEYS = Object.keys(BI_DASHBOARD_THEMES);

export function getDashboardThemePreset(key: string | undefined): BiDashboardThemePreset | null {
  if (!key || key === "auto") return null;
  return BI_DASHBOARD_THEMES[key] ?? null;
}

/**
 * 解析生效主题：具名预设以 mode/palette 钉死图表主题；
 * 无预设回落亮暗自动（现状行为）。
 */
export function resolveDashboardTheme(
  key: string | undefined,
  autoIsDark: boolean
): { theme: BiResolvedTheme; preset: BiDashboardThemePreset | null } {
  const preset = getDashboardThemePreset(key);
  if (!preset) {
    return { theme: resolveTheme(autoIsDark ? "dark" : "light"), preset: null };
  }
  const base = resolveTheme(preset.mode);
  return {
    theme: preset.palette ? { ...base, palette: preset.palette } : base,
    preset,
  };
}
