import { useState, useRef, useEffect } from "react";
import { useStore } from "../lib/store";
import { snippets } from "../lib/snippets";

interface ToolDef {
  label: string;
  title: string;
  insert?: string;
  wrap?: [string, string];
  block?: string;
}

const tools: ToolDef[] = [
  { label: "H1", title: "一级标题", block: "# " },
  { label: "H2", title: "二级标题", block: "## " },
  { label: "H3", title: "三级标题", block: "### " },
  { label: "B", title: "粗体", wrap: ["**", "**"] },
  { label: "I", title: "斜体", wrap: ["*", "*"] },
  { label: "S", title: "删除线", wrap: ["~~", "~~"] },
  { label: "`", title: "行内代码", wrap: ["`", "`"] },
  { label: "</>", title: "代码块", block: "```\n" },
  { label: "\u2014", title: "引用", block: "> " },
  { label: "\u2022", title: "无序列表", block: "- " },
  { label: "1.", title: "有序列表", block: "1. " },
  { label: "\u2610", title: "任务列表", block: "- [ ] " },
  { label: "\u2194", title: "分割线", block: "\n---\n" },
  { label: "\u2197", title: "链接", insert: "[链接文字](url)" },
  { label: "\u25a3", title: "图片", insert: "![alt](url)" },
  { label: "$", title: "数学公式", insert: "$$\n\n$$" },
  { label: "$$", title: "行内数学", wrap: ["$", "$"] },
  { label: "|", title: "表格", insert: "| 列1 | 列2 | 列3 |\n|------|------|------|\n|      |      |      |\n|      |      |      |" },
  { label: "✓", title: "复选框列表", block: "- [x] " },
  { label: "📝", title: "脚注", insert: "[^1]\n\n[^1]: 脚注内容" },
];

export function Toolbar() {
  const activeFile = useStore((s) => s.activeFile);
  const unsavedChanges = useStore((s) => s.unsavedChanges);
  const fileContents = useStore((s) => s.fileContents);
  const updateContent = useStore((s) => s.updateContent);
  const [snippetOpen, setSnippetOpen] = useState(false);
  const snippetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!snippetOpen) return;
    const close = (e: MouseEvent) => {
      if (snippetRef.current && !snippetRef.current.contains(e.target as Node)) {
        setSnippetOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [snippetOpen]);

  if (!activeFile) return null;

  const content = unsavedChanges[activeFile] ?? fileContents[activeFile] ?? "";

  const apply = (tool: ToolDef) => {
    if (tool.block) {
      const lines = content.split("\n");
      const lastLine = lines.length - 1;
      const lastContent = lines[lastLine] ?? "";
      if (lastContent === "") {
        lines[lastLine] = tool.block + lastContent;
      } else {
        lines.push(tool.block);
      }
      updateContent(activeFile, lines.join("\n"));
    } else if (tool.wrap) {
      updateContent(activeFile, content + tool.wrap[0] + "文字" + tool.wrap[1]);
    } else if (tool.insert) {
      updateContent(activeFile, content + tool.insert);
    }
  };

  return (
    <div className="toolbar">
      {tools.map((t) => (
        <button
          key={t.title}
          className="toolbar-btn"
          title={t.title}
          onClick={() => apply(t)}
        >
          {t.label}
        </button>
      ))}
      <div className="toolbar-separator" />
      <div ref={snippetRef} style={{ position: "relative" }}>
        <button
          className="toolbar-btn"
          title="插入代码片段"
          onClick={() => setSnippetOpen(!snippetOpen)}
        >
          {"{}"}
        </button>
        {snippetOpen && (
          <div className="snippet-dropdown">
            {snippets.map((s) => (
              <button
                key={s.name}
                className="snippet-item"
                onClick={() => {
                  updateContent(activeFile, content + "\n```\n" + s.code + "\n```\n");
                  setSnippetOpen(false);
                }}
              >
                <span className="snippet-name">{s.label}</span>
                <span className="snippet-lang">{s.language}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
