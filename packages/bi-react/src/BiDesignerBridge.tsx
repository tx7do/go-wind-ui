/**
 * 设计器桥接壳（M3，docs/bi-designer.md §4）：
 * React 容器内 createApp 挂载 Vue 版 BiDesigner，schema 类型与布局数学同源（bi-core），
 * 主题经 bi-core 的 watchDark 共享单例自动跟随 html.dark，无需双端各自实现。
 *
 * 已知边界：initialSchema 为挂载时一次性快照（重挂载需换 key）；运行期改 props 不回灌。
 */
import { useEffect, useRef } from "react";
import { createApp, defineComponent, h } from "vue";
import type { Component, App as VueApp } from "vue";
import { BiDesigner, provideBiEnv } from "@go-wind-ui/bi-vue";
import type { BiDashboardSchema } from "@go-wind-ui/bi-core";

import type { BiEnv } from "./env";

export interface BiDesignerReactProps {
  /** 初始 schema（挂载时快照） */
  initialSchema?: Partial<BiDashboardSchema>;
  /** 无 initialSchema 时使用内置演示 schema */
  demo?: boolean;
  /** 设计器任意提交后回调（schema 已序列化安全） */
  onChange?: (schema: BiDashboardSchema) => void;
  /** 环境注入（resolvers 等），透传给 Vue 侧 provideBiEnv */
  env?: BiEnv;
  style?: React.CSSProperties;
  className?: string;
}

export function BiDesignerReact(props: BiDesignerReactProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<VueApp | null>(null);
  // 回调经 ref 转发：React 侧函数身份变化不触发 Vue 应用重建
  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;

  const mountPropsRef = useRef(props);
  mountPropsRef.current = props;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const initial = mountPropsRef.current;
    const DesignerRoot = defineComponent({
      name: "BiDesignerReactRoot",
      setup() {
        // env 注入走 Vue 侧 provider（resolvers 供画布预览解析 api 数据集）
        if (initial.env) provideBiEnv(initial.env);
        return () =>
          h(BiDesigner as Component, {
            initialSchema: initial.initialSchema,
            demo: initial.demo ?? false,
            onChange: (schema: BiDashboardSchema) => onChangeRef.current?.(schema),
          });
      },
    });

    const app = createApp(DesignerRoot);
    app.mount(host);
    appRef.current = app;

    return () => {
      app.unmount();
      appRef.current = null;
      // createApp mount 会留下挂载容器内的 vnode，外壳 div 保留给下次挂载
      host.innerHTML = "";
    };
    // 仅挂载一次：props 变化不重建（initialSchema 语义见文件头注释）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={hostRef}
      className={props.className}
      style={{ height: "100%", minHeight: 480, ...props.style }}
    />
  );
}
