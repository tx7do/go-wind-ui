# @go-wind/editor-vue

Vue 3 编辑器套件：富文本（Tiptap 3）、代码（Monaco）、JSON（json-editor-vue）、Markdown（md-editor-v3）、纯文本。抽自 go-wind-admin 生产套件，主题跟随与图片上传可注入、缺省零配置可用。

## 安装

```bash
pnpm add @go-wind/editor-vue
```

## 快速开始

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Editor, EditorType } from "@go-wind/editor-vue";

const content = ref("<p>hello</p>");
</script>

<template>
  <!-- 分发壳：按 editorType 切换五种编辑器，全部懒加载 -->
  <Editor v-model="content" :editor-type="EditorType.RICH_TEXT" :height="360" />
</template>
```

也可以直接引单个编辑器：`TiptapEditor` / `MarkdownEditor` / `CodeEditor` / `JsonEditor` / `PlainTextEditor`。

## 环境注入（可选）

```ts
import { provideEditorEnv } from "@go-wind/editor-vue";

provideEditorEnv({
  // 图片上传：返回可内嵌 URL；缺省转 base64 data URL
  uploadImage: async (file) => (await myUpload(file)).url,
  // 主题模式 getter（响应式）；缺省自动跟随 html.dark class + 系统偏好
  themeMode: () => themeStore.mode,
});
```

**语言**：内置 zh-CN / en-US（`setEditorLocale("en-US")` 全局切换，`setEditorMessages` 深合并自定义文案），不依赖 vue-i18n。

## 主题

暗色判定全包唯一真相源：宿主切暗色时给 `<html>` 加/去 `dark` class 即可，Monaco（vs-dark）、Tiptap、md-editor-v3、jsoneditor 全部自动跟随。

## 依赖说明

Tiptap / Monaco / md-editor-v3 / json-editor-vue 为 dependencies（随包安装），vue 与 element-plus（仅 Tiptap 消息提示用）为 peer。Monaco worker 经 `?worker` 导入，要求宿主为 Vite 构建（本包 ESM-only）。
