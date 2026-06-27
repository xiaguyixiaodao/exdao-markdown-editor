import { type Editor } from "@tiptap/react";

interface ToolbarProps {
  editor: Editor | null;
}

const headingTools = [
  { label: "H1", title: "一级标题", level: 1 as const },
  { label: "H2", title: "二级标题", level: 2 as const },
  { label: "H3", title: "三级标题", level: 3 as const },
  { label: "H4", title: "四级标题", level: 4 as const },
];

const inlineTools = [
  { label: "B", title: "粗体", action: (e: Editor) => e.chain().focus().toggleBold().run(), active: (e: Editor) => e.isActive("bold") },
  { label: "I", title: "斜体", action: (e: Editor) => e.chain().focus().toggleItalic().run(), active: (e: Editor) => e.isActive("italic") },
  { label: "S", title: "删除线", action: (e: Editor) => e.chain().focus().toggleStrike().run(), active: (e: Editor) => e.isActive("strike") },
  { label: "`", title: "行内代码", action: (e: Editor) => e.chain().focus().toggleCode().run(), active: (e: Editor) => e.isActive("code") },
  { label: "Hl", title: "高亮", action: (e: Editor) => e.chain().focus().toggleHighlight().run(), active: (e: Editor) => e.isActive("highlight") },
];

const blockTools = [
  { label: "</>", title: "代码块", action: (e: Editor) => e.chain().focus().toggleCodeBlock().run(), active: (e: Editor) => e.isActive("codeBlock") },
  { label: "\u2014", title: "引用", action: (e: Editor) => e.chain().focus().toggleBlockquote().run(), active: (e: Editor) => e.isActive("blockquote") },
  { label: "\u2022", title: "无序列表", action: (e: Editor) => e.chain().focus().toggleBulletList().run(), active: (e: Editor) => e.isActive("bulletList") },
  { label: "1.", title: "有序列表", action: (e: Editor) => e.chain().focus().toggleOrderedList().run(), active: (e: Editor) => e.isActive("orderedList") },
  { label: "\u2610", title: "任务列表", action: (e: Editor) => e.chain().focus().toggleTaskList().run(), active: (e: Editor) => e.isActive("taskList") },
  { label: "\u2194", title: "分割线", action: (e: Editor) => e.chain().focus().setHorizontalRule().run() },
];

const insertTools = [
  { label: "\u2197", title: "链接", action: (e: Editor) => {
    const url = prompt("输入链接地址:", "https://");
    if (url) e.chain().focus().setLink({ href: url }).run();
  }, active: (e: Editor) => e.isActive("link") },
  { label: "\u25a3", title: "表格", action: (e: Editor) => e.chain().focus().insertTable({ rows: 3, cols: 3 }).run() },
  { label: "$", title: "数学公式", action: (e: Editor) => e.chain().focus().insertContent("$$\n\n$$").run() },
];

export function WysiwygToolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  return (
    <div className="toolbar">
      {headingTools.map((t) => (
        <button
          key={t.title}
          className={`toolbar-btn ${editor.isActive("heading", { level: t.level }) ? "toolbar-btn-active" : ""}`}
          title={t.title}
          onClick={() => editor.chain().focus().toggleHeading({ level: t.level }).run()}
        >
          {t.label}
        </button>
      ))}
      <div className="toolbar-separator" />
      {inlineTools.map((t) => (
        <button
          key={t.title}
          className={`toolbar-btn ${t.active(editor) ? "toolbar-btn-active" : ""}`}
          title={t.title}
          onClick={() => t.action(editor)}
        >
          {t.label}
        </button>
      ))}
      <div className="toolbar-separator" />
      {blockTools.map((t) => (
        <button
          key={t.title}
          className={`toolbar-btn ${t.active?.(editor) ? "toolbar-btn-active" : ""}`}
          title={t.title}
          onClick={() => t.action(editor)}
        >
          {t.label}
        </button>
      ))}
      <div className="toolbar-separator" />
      {insertTools.map((t) => (
        <button
          key={t.title}
          className={`toolbar-btn ${t.active?.(editor) ? "toolbar-btn-active" : ""}`}
          title={t.title}
          onClick={() => t.action(editor)}
        >
          {t.label}
        </button>
      ))}
      <div className="toolbar-separator" />
      <button
        className="toolbar-btn"
        title="撤销"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        ↩
      </button>
      <button
        className="toolbar-btn"
        title="重做"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        ↪
      </button>
    </div>
  );
}
