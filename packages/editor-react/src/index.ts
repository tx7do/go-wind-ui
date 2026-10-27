/**
 * @go-wind-ui/editor-react
 *
 * React 19 编辑器套件：富文本（Tiptap 3）、代码（Monaco）、JSON、Markdown（md-editor-rt）、纯文本。
 * 主题跟随与图片上传可通过 EditorProvider 注入，缺省零配置可用。
 */
export { default as Editor } from './Editor';
export { default as TiptapEditor } from './TiptapEditor';
export { default as CodeEditor } from './CodeEditor';
export { default as JsonEditor } from './JsonEditor';
export { default as MarkdownEditor } from './MarkdownEditor';
export { default as PlainTextEditor } from './PlainTextEditor';
export { Toolbar as TiptapToolbar } from './TiptapEditor/Toolbar';
export { StatusBar as TiptapStatusBar } from './TiptapEditor/StatusBar';
export { useTiptapEditor } from './TiptapEditor/useTiptapEditor';
export { extractImageFiles } from './TiptapEditor/defaultImageUpload';

// 环境注入（i18n / 图片上传 / 主题判定）
export {
  EditorProvider,
  useEditorEnv,
  useTranslation,
  $t,
  setEditorLocale,
  setEditorMessages,
  isDarkMode,
  defaultUploadImage,
  resolveUpload,
} from './env';
export type { EditorEnv, EditorLocale, Translator } from './env';

export * from './types';
