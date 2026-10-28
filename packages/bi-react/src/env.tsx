/**
 * BI 运行环境（React 版）：BiProvider 注入主题/resolvers/文案。
 * 缺省零配置：主题自动跟随 html.dark + 系统偏好（useSyncExternalStore 订阅）。
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { RefObject, ReactNode } from "react";

import {
  createTinyStore,
  detectDark,
  resolveTheme,
  watchDark,
} from "@go-wind-ui/bi-core";
import type { BiDatasetResolver, BiResolvedTheme, TinyStore } from "@go-wind-ui/bi-core";

export interface BiEnv {
  /** 宿主主题模式 getter；缺省自动跟随 html.dark + 系统偏好 */
  themeMode?: () => "light" | "dark" | "auto";
  /** api 型数据集的取数函数表（键 = dataset.id） */
  resolvers?: Record<string, BiDatasetResolver>;
  /** 空数据占位文案 */
  emptyText?: string;
  /** 自定义文案（当前渲染器文案极少，预留深合并位） */
  messages?: Record<string, any> | null;
}

const BiEnvContext = createContext<BiEnv | null>(null);

export function BiProvider(props: { env: BiEnv; children: ReactNode }) {
  return <BiEnvContext.Provider value={props.env}>{props.children}</BiEnvContext.Provider>;
}

export function useBiEnv(): BiEnv {
  return useContext(BiEnvContext) ?? {};
}

// ============ 主题：模块级单一暗色源 ============
const darkStore: TinyStore<boolean> = createTinyStore(detectDark());

let bound = false;
function ensureDarkBinding() {
  if (bound || typeof document === "undefined") return;
  bound = true;
  watchDark((dark) => darkStore.set(dark));
}

export function useBiTheme(): BiResolvedTheme {
  const env = useBiEnv();
  ensureDarkBinding();
  const dark = useSyncExternalStore(darkStore.subscribe, darkStore.getState);
  return useMemo(() => {
    if (!env.themeMode) return resolveTheme(dark ? "dark" : "light");
    const mode = env.themeMode();
    return resolveTheme(mode === "auto" ? (dark ? "dark" : "light") : mode);
  }, [env, dark]);
}

/** 容器宽度跟踪（渲染器布局需要像素宽） */
export function useContainerWidth(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
