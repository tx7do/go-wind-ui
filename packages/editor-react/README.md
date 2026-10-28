# @go-wind/editor-react

React 19 编辑器套件：富文本（Tiptap 3）、代码（Monaco）、JSON、Markdown（md-editor-rt）、纯文本。抽自 go-wind-admin 生产套件，主题跟随与图片上传可注入、缺省零配置可用。

## 安装

```bash
pnpm add @go-wind/editor-react
```

## 快速开始

```tsx
import { Editor, EditorType } from "@go-wind/editor-react";

<Editor
  value={html}
  onChange={setHtml}
  editorType={EditorType.RICH_TEXT}
  height={360}
/>
```

也可直接引单个编辑器：`TiptapEditor` / `MarkdownEditor` / `CodeEditor` / `JsonEditor` / `PlainTextEditor`（props 均为 `value` + `onChange`）。

## 环境注入（可选）

```tsx
import { EditorProvider } from "@go-wind/editor-react";

<EditorProvider
  env={{
    // 全局图片上传（组件级 uploadImage prop 优先）；缺省转 base64
    uploadImage: async (file) => (await myUpload(file)).url,
    // 覆盖界面语言与文案
    locale: "en-US",
  }}
>
  <App />
</EditorProvider>
```

**语言**：内置 zh-CN / en-US（`setEditorLocale("en-US")` 全局切换）；组件内 `useTranslation()` 与 react-i18next 同形，i18next 的 `t(key, '缺省文案')` 字符串重载兼容。

## 主题

暗色判定：`html.dark` class 优先，其次系统偏好。宿主切暗色时给 `<html>` 加/去 `dark` class，Monaco（vs-dark）、Tiptap、md-editor-rt 自动跟随（组件内 MutationObserver 自跟踪，无需应用层重渲染）。

## 依赖说明

Tiptap / Monaco / md-editor-rt 为 dependencies（随包安装），react/react-dom/antd/@ant-design/icons 为 peer。Monaco worker 经 `?worker` 导入，要求宿主为 Vite 构建（本包 ESM-only）。
