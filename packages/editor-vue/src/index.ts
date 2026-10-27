/**
 * @go-wind-ui/editor-vue
 *
 * Vue 3 编辑器套件：富文本（Tiptap 3）、代码（Monaco）、JSON、Markdown（md-editor-v3）、纯文本。
 * 主题跟随与图片上传可通过 provideEditorEnv 注入，缺省零配置可用。
 */
export { default as Editor } from "./Editor.vue";
export { default as TiptapEditor } from "./TiptapEditor/index.vue";
export { default as CodeEditor } from "./CodeEditor.vue";
export { default as JsonEditor } from "./JsonEditor.vue";
export { default as MarkdownEditor } from "./MarkdownEditor.vue";
export { default as PlainTextEditor } from "./PlainTextEditor.vue";
export { default as TiptapToolbar } from "./TiptapEditor/TiptapToolbar.vue";
export { default as TiptapStatusBar } from "./TiptapEditor/TiptapStatusBar.vue";
export { useTiptapEditor } from "./TiptapEditor/composables/useTiptapEditor";

// 环境注入（主题跟随 / 图片上传 / i18n）
export {
  provideEditorEnv,
  useEditorEnv,
  useEditorDark,
  useEditorUpload,
  defaultUploadImage,
  isDarkNow,
  themeTick,
  $t,
  i18n,
  useI18n,
  setEditorLocale,
  setEditorMessages,
  createTranslator,
} from "./env";
export type { EditorEnv, EditorThemeMode, EditorLocale } from "./env";

export * from "./types";
