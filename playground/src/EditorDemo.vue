<template>
  <div class="ed-demo">
    <ElRadioGroup v-model="current" class="ed-demo__switch">
      <ElRadioButton value="tiptap">富文本 Tiptap</ElRadioButton>
      <ElRadioButton value="markdown">Markdown</ElRadioButton>
      <ElRadioButton value="code">代码 Monaco</ElRadioButton>
      <ElRadioButton value="json">JSON</ElRadioButton>
      <ElRadioButton value="plain">纯文本</ElRadioButton>
    </ElRadioGroup>

    <TiptapEditor v-if="current === 'tiptap'" v-model="html" :height="360" class="ed-demo__box" />
    <MarkdownEditor v-else-if="current === 'markdown'" v-model="md" class="ed-demo__box" />
    <CodeEditor
      v-else-if="current === 'code'"
      v-model="code"
      language="typescript"
      :height="360"
      class="ed-demo__box"
    />
    <JsonEditor v-else-if="current === 'json'" v-model="json" class="ed-demo__box" />
    <PlainTextEditor v-else v-model="text" :height="360" class="ed-demo__box" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElRadioButton, ElRadioGroup } from "element-plus";
import {
  TiptapEditor,
  MarkdownEditor,
  CodeEditor,
  JsonEditor,
  PlainTextEditor,
} from "@go-wind/editor-vue";

const current = ref("tiptap");

const html = ref(`<h2>@go-wind/editor-vue</h2>
<p>富文本编辑器：<strong>加粗</strong>、<em>斜体</em>、<u>下划线</u>、<code>行内代码</code>。</p>
<ul><li>列表项一</li><li>列表项二</li></ul>
<p>直接粘贴或拖入图片试试（缺省转 base64）。</p>`);

const md = ref(`# Markdown

- **md-editor-v3** 内核
- 主题跟随 \`html.dark\`
`);

const code = ref(`// Monaco 代码编辑器
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`);

const json = ref(`{
  "name": "go-wind-ui",
  "packages": ["element-pro", "editor-vue", "editor-react", "locale"],
  "stars": 0
}`);

const text = ref("Plain text editor");
</script>

<style scoped>
.ed-demo {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ed-demo__box {
  flex: 1;
  min-height: 0;
}
</style>
