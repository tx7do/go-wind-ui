import { useEffect, useState } from "react";
import { Button, Radio, Select, Switch, Space, Typography } from "antd";
import {
  EditorProvider,
  TiptapEditor,
  CodeEditor,
  JsonEditor,
  MarkdownEditor,
  PlainTextEditor,
  setEditorLocale,
  type EditorLocale,
} from "@go-wind-ui/editor-react";

const SAMPLE_HTML = `<h2>@go-wind-ui/editor-react</h2>
<p>富文本编辑器：<strong>加粗</strong>、<em>斜体</em>、<u>下划线</u>、<code>行内代码</code>。</p>
<ul><li>列表项一</li><li>列表项二</li></ul>
<p>直接粘贴或拖入图片试试（缺省转 base64）。</p>`;

const SAMPLE_CODE = `// Monaco 代码编辑器
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`;

const SAMPLE_JSON = JSON.stringify(
  { name: "go-wind-ui", packages: ["element-pro", "editor-react"], stars: 0 },
  null,
  2
);

type EditorKind = "tiptap" | "markdown" | "code" | "json" | "plain";

export default function App() {
  const [dark, setDark] = useState(false);
  const [locale, setLocale] = useState<EditorLocale>("zh-CN");
  const [kind, setKind] = useState<EditorKind>("tiptap");

  const [html, setHtml] = useState(SAMPLE_HTML);
  const [md, setMd] = useState("# Markdown\n\n- md-editor-rt 内核\n- 主题跟随 html.dark\n");
  const [code, setCode] = useState(SAMPLE_CODE);
  const [json, setJson] = useState(SAMPLE_JSON);
  const [text, setText] = useState("Plain text editor");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    setEditorLocale(locale);
  }, [locale]);

  return (
    <EditorProvider env={{ locale, uploadImage: undefined }}>
      <div className="pg-app">
        <header className="pg-header">
          <Typography.Title level={4} style={{ margin: 0 }}>
            @go-wind-ui/editor-react playground
          </Typography.Title>
          <Space size="middle" align="center">
            <span>暗色</span>
            <Switch checked={dark} onChange={setDark} />
            <Select
              value={locale}
              onChange={(v) => setLocale(v)}
              style={{ width: 110 }}
              options={[
                { value: "zh-CN", label: "中文" },
                { value: "en-US", label: "English" },
              ]}
            />
          </Space>
        </header>

        <div className="pg-switch">
          <Radio.Group value={kind} onChange={(e) => setKind(e.target.value)}>
            <Radio.Button value="tiptap">富文本 Tiptap</Radio.Button>
            <Radio.Button value="markdown">Markdown</Radio.Button>
            <Radio.Button value="code">代码 Monaco</Radio.Button>
            <Radio.Button value="json">JSON</Radio.Button>
            <Radio.Button value="plain">纯文本</Radio.Button>
          </Radio.Group>
          <Button type="primary" ghost onClick={() => console.log("html:", html, "md:", md, "code:", code, "json:", json, "text:", text)}>
            打印当前值
          </Button>
        </div>

        <main className="pg-main">
          {kind === "tiptap" && <TiptapEditor value={html} onChange={setHtml} height={360} />}
          {kind === "markdown" && <MarkdownEditor value={md} onChange={setMd} height={360} />}
          {kind === "code" && (
            <CodeEditor
              value={code}
              onChange={setCode}
              options={{ language: "typescript" }}
              height={360}
            />
          )}
          {kind === "json" && <JsonEditor value={json} onChange={setJson} height={360} />}
          {kind === "plain" && <PlainTextEditor value={text} onChange={setText} height={360} />}
        </main>
      </div>
    </EditorProvider>
  );
}
