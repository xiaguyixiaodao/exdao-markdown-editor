import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useStore, setupFileWatcher } from "./lib/store";
import { resolveWikiLink, selectVaultDirectory } from "./lib/vault";
import { FileTree } from "./components/FileTree";
import { CodeMirrorEditor, EditorHandle } from "./components/Editor";
import { WysiwygEditor } from "./components/WysiwygEditor";
import { WysiwygToolbar } from "./components/WysiwygToolbar";
import { Preview } from "./components/Preview";
import { Outline } from "./components/Outline";
import { StatusBar } from "./components/StatusBar";
import { Toolbar } from "./components/Toolbar";
import { TabBar } from "./components/TabBar";
import { QuickSwitcher } from "./components/QuickSwitcher";
import { FindAndReplace } from "./components/FindAndReplace";
import { Welcome } from "./components/Welcome";
import { Settings } from "./components/Settings";
import { MenuBar } from "./components/MenuBar";
import { themes } from "./lib/themes";
import { mdStyles } from "./lib/mdStyles";
import { exportToHtml, downloadFile, exportToPdf } from "./lib/export";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { common, createLowlight } from "lowlight";
import { markdownToHtml, htmlToMarkdown } from "./lib/mdConvert";
import "katex/dist/katex.min.css";
import "./styles/layout.css";

const lowlight = createLowlight(common);

export default function App() {
  const vaultPath = useStore((s) => s.rootPath);
  const activeFile = useStore((s) => s.activeFile);
  const fileContents = useStore((s) => s.fileContents);
  const unsavedChanges = useStore((s) => s.unsavedChanges);
  const openFiles = useStore((s) => s.openFiles);
  const editorMode = useStore((s) => s.editorMode);
  const toolbarOpen = useStore((s) => s.toolbarOpen);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const wordWrap = useStore((s) => s.wordWrap);
  const editorWidth = useStore((s) => s.editorWidth);
  const updateContent = useStore((s) => s.updateContent);
  const saveFile = useStore((s) => s.saveFile);
  const openFile = useStore((s) => s.openFile);
  const openFolder = useStore((s) => s.openFolder);
  const createUntitled = useStore((s) => s.createUntitled);
  const closeFile = useStore((s) => s.closeFile);
  const closeAllFiles = useStore((s) => s.closeAllFiles);
  const saveFileAsDialog = useStore((s) => s.saveFileAsDialog);
  const toggleQuickSwitcher = useStore((s) => s.toggleQuickSwitcher);
  const setEditorMode = useStore((s) => s.setEditorMode);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const toggleOutline = useStore((s) => s.toggleOutline);
  const toggleToolbar = useStore((s) => s.toggleToolbar);
  const toggleWordWrap = useStore((s) => s.toggleWordWrap);
  const setTheme = useStore((s) => s.setTheme);
  const currentTheme = useStore((s) => s.theme);
  const setMdStyle = useStore((s) => s.setMdStyle);
  const currentMdStyle = useStore((s) => s.mdStyle);

  const editorRef = useRef<EditorHandle>(null);
  const [editorScrollRatio, setEditorScrollRatio] = useState(0);
  const saveRef = useRef<() => void>(() => {});
  const tiptapEditorRef = useRef<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const autoSave = useStore((s) => s.autoSave);
  const setCursorPosition = useStore((s) => s.setCursorPosition);
  const findReplaceOpen = useStore((s) => s.findReplaceOpen);
  const toggleFindReplace = useStore((s) => s.toggleFindReplace);

  const handleWysiwygUpdate = useCallback(({ editor: e }: { editor: any }) => {
    const md = htmlToMarkdown(e.getHTML());
    const state = useStore.getState();
    if (state.activeFile) {
      state.updateContent(state.activeFile, md);
    }
  }, []);

  const tiptapEditor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: "" }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Highlight,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: "",
    onUpdate: handleWysiwygUpdate,
    editorProps: {
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          saveRef.current();
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    tiptapEditorRef.current = tiptapEditor;
  }, [tiptapEditor]);

  useEffect(() => {
    setupFileWatcher();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        toggleQuickSwitcher();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        const modes = ["source", "split", "preview"] as const;
        const current = useStore.getState().editorMode;
        const next = modes[(modes.indexOf(current) + 1) % modes.length];
        setEditorMode(next);
      }
      if (e.key === "Escape" && useStore.getState().editorMode === "source") {
        e.preventDefault();
        setEditorMode("preview");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        toggleOutline();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        toggleFindReplace();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        toggleFindReplace();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        if (activeFile) {
          const content = useStore.getState().unsavedChanges[activeFile] ?? useStore.getState().fileContents[activeFile] ?? "";
          const filename = activeFile.split(/[/\\]/).pop()?.replace(/\.md$/i, "") || "document";
          exportToPdf(content, filename);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleQuickSwitcher, setEditorMode, toggleSidebar, toggleOutline, toggleFindReplace]);

  const handleNavigate = useCallback(
    async (target: string) => {
      if (!vaultPath) return;
      const resolved = await resolveWikiLink(vaultPath, target);
      if (resolved) {
        await openFile(resolved);
      } else {
        await useStore.getState().createNewFile(vaultPath, `${target}.md`);
      }
    },
    [vaultPath, openFile]
  );

  const currentContent = activeFile
    ? unsavedChanges[activeFile] ?? fileContents[activeFile] ?? ""
    : "";

  const handleChange = useCallback(
    (value: string) => {
      if (activeFile) {
        updateContent(activeFile, value);
      }
    },
    [activeFile, updateContent]
  );

  const handleSave = useCallback(() => {
    if (activeFile) {
      saveFile(activeFile);
    }
  }, [activeFile, saveFile]);

  useEffect(() => {
    saveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    if (!autoSave || !activeFile) return;
    const isDirty = activeFile in unsavedChanges;
    if (!isDirty) return;
    const timer = setTimeout(() => {
      saveFile(activeFile);
    }, 2000);
    return () => clearTimeout(timer);
  }, [autoSave, activeFile, unsavedChanges, saveFile]);

  const handleEditorScroll = useCallback(
    (info: { scrollTop: number; scrollHeight: number; clientHeight: number }) => {
      if (editorMode !== "split") return;
      const ratio = info.scrollTop / (info.scrollHeight - info.clientHeight || 1);
      setEditorScrollRatio(ratio);
    },
    [editorMode]
  );

  const handlePreviewScrollAsRatio = useCallback((ratio: number) => {
    setEditorScrollRatio(ratio);
  }, []);

  const handleJumpToLine = useCallback((line: number) => {
    editorRef.current?.scrollToLine(line);
  }, []);

  const handleOpenFolder = useCallback(async () => {
    const path = await selectVaultDirectory();
    if (path) await openFolder(path);
  }, [openFolder]);

  const menus = [
    {
      label: "文件",
      items: [
        { label: "新建文档", shortcut: "Ctrl+N", action: () => createUntitled() },
        { label: "打开仓库", shortcut: "Ctrl+O", action: handleOpenFolder },
        { divider: true as const, label: "" },
        { label: "保存", shortcut: "Ctrl+S", action: handleSave, disabled: !activeFile },
        { label: "另存为...", shortcut: "Ctrl+Shift+S", action: () => saveFileAsDialog(), disabled: !activeFile },
        { divider: true as const, label: "" },
        { label: "关闭当前文件", shortcut: "Ctrl+W", action: () => activeFile && closeFile(activeFile), disabled: !activeFile },
        { label: "关闭所有文件", action: () => closeAllFiles(), disabled: openFiles.length === 0 },
        { divider: true as const, label: "" },
        {
          label: "导出为 HTML",
          action: () => {
            if (!activeFile) return;
            const content = unsavedChanges[activeFile] ?? fileContents[activeFile] ?? "";
            const filename = activeFile.split(/[/\\]/).pop()?.replace(/\.md$/i, "") || "document";
            const html = exportToHtml(content, filename);
            downloadFile(html, `${filename}.html`, "text/html;charset=utf-8");
          },
          disabled: !activeFile,
        },
        {
          label: "打印 / 导出 PDF",
          shortcut: "Ctrl+P",
          action: () => {
            if (!activeFile) return;
            const content = unsavedChanges[activeFile] ?? fileContents[activeFile] ?? "";
            const filename = activeFile.split(/[/\\]/).pop()?.replace(/\.md$/i, "") || "document";
            exportToPdf(content, filename);
          },
          disabled: !activeFile,
        },
        { divider: true as const, label: "" },
        { label: "设置", action: () => setSettingsOpen(true) },
      ],
    },
    {
      label: "编辑",
      items: [
        {
          label: "撤销",
          shortcut: "Ctrl+Z",
          action: () => {
            const mode = useStore.getState().editorMode;
            if (mode === "preview" && tiptapEditor) {
              tiptapEditor.chain().focus().undo().run();
            } else {
              editorRef.current?.scrollToLine(0);
            }
          },
        },
        {
          label: "重做",
          shortcut: "Ctrl+Y",
          action: () => {
            const mode = useStore.getState().editorMode;
            if (mode === "preview" && tiptapEditor) {
              tiptapEditor.chain().focus().redo().run();
            }
          },
        },
        { divider: true as const, label: "" },
        { label: "查找", shortcut: "Ctrl+F", action: toggleFindReplace },
        { label: "替换", shortcut: "Ctrl+H", action: toggleFindReplace },
      ],
    },
    {
      label: "视图",
      items: [
        { label: "源码模式", action: () => setEditorMode("source"), disabled: editorMode === "source" },
        { label: "分屏模式", shortcut: "Ctrl+E", action: () => setEditorMode("split"), disabled: editorMode === "split" },
        { label: "预览模式", action: () => setEditorMode("preview"), disabled: editorMode === "preview" },
        { divider: true as const, label: "" },
        { label: `${toolbarOpen ? "隐藏" : "显示"}工具栏`, action: toggleToolbar },
        { label: `${useStore.getState().sidebarOpen ? "隐藏" : "显示"}侧边栏`, shortcut: "Ctrl+B", action: toggleSidebar },
        { label: `${useStore.getState().outlineOpen ? "隐藏" : "显示"}大纲`, shortcut: "Ctrl+J", action: toggleOutline },
        { divider: true as const, label: "" },
        { label: `${wordWrap ? "关闭" : "开启"}自动换行`, action: toggleWordWrap },
        { divider: true as const, label: "" },
        {
          label: "主题",
          children: themes.map((t) => ({
            label: t.label,
            action: () => setTheme(t.name),
            disabled: currentTheme === t.name,
          })),
        },
        {
          label: "样式",
          children: mdStyles.map((s) => ({
            label: s.label,
            action: () => setMdStyle(s.name),
            disabled: currentMdStyle === s.name,
          })),
        },
      ],
    },
    {
      label: "帮助",
      items: [
        { label: "关于", action: () => setAboutOpen(true) },
      ],
    },
  ];

  if (!vaultPath && openFiles.length === 0 && !sidebarOpen) {
    return <Welcome />;
  }

  return (
    <div className="app-layout">
      <MenuBar menus={menus} />
      <div className="app-body">
        <FileTree />
        <div className="editor-area">
          <TabBar />
          {toolbarOpen && editorMode === "source" && <Toolbar />}
          {toolbarOpen && editorMode === "preview" && <WysiwygToolbar editor={tiptapEditor} />}
          <div className="editor-content" style={{ "--editor-width": `${editorWidth}px`, position: "relative" } as React.CSSProperties}>
            {findReplaceOpen && editorMode !== "preview" && (
              <FindAndReplace isOpen={findReplaceOpen} onClose={toggleFindReplace} />
            )}
            {editorMode === "source" && (
              <div className="editor-pane">
                {activeFile ? (
                  <CodeMirrorEditor
                    ref={editorRef}
                    doc={currentContent}
                    onChange={handleChange}
                    onSave={handleSave}
                    onNavigate={handleNavigate}
                    onScroll={handleEditorScroll}
                    onCursorChange={setCursorPosition}
                    wordWrap={wordWrap}
                  />
                ) : (
                  <div className="editor-empty">
                    <p>选择一个文件开始编辑</p>
                  </div>
                )}
              </div>
            )}
            {editorMode === "preview" && (
              <div className="editor-pane">
                {activeFile ? (
                  <WysiwygEditor
                    doc={currentContent}
                    onChange={handleChange}
                    onSave={handleSave}
                    editorRef={tiptapEditorRef}
                  />
                ) : (
                  <div className="editor-empty">
                    <p>选择一个文件开始编辑</p>
                  </div>
                )}
              </div>
            )}
            {editorMode === "split" && (
              <>
                <div className="editor-pane editor-pane-split">
                  {activeFile ? (
                    <CodeMirrorEditor
                      ref={editorRef}
                      doc={currentContent}
                      onChange={handleChange}
                      onSave={handleSave}
                      onNavigate={handleNavigate}
                      onScroll={handleEditorScroll}
                      onCursorChange={setCursorPosition}
                      wordWrap={wordWrap}
                    />
                  ) : (
                    <div className="editor-empty">
                      <p>选择一个文件开始编辑</p>
                    </div>
                  )}
                </div>
                <div className="preview-pane preview-pane-split">
                  <Preview
                    sourceScrollRatio={editorScrollRatio}
                    onSourceScroll={handlePreviewScrollAsRatio}
                    onNavigate={handleNavigate}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        <Outline onJumpToLine={handleJumpToLine} />
      </div>
      <StatusBar />
      <QuickSwitcher />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {aboutOpen && (
        <div className="settings-overlay" onClick={() => setAboutOpen(false)}>
          <div className="settings-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 380 }}>
            <div className="settings-header">
              <h2>关于 ExDao Editor</h2>
              <button className="settings-close" onClick={() => setAboutOpen(false)}>&times;</button>
            </div>
            <div className="settings-body" style={{ textAlign: "center", padding: "24px 20px" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-heading)", marginBottom: 4 }}>ExDao Editor</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>轻量级 Markdown 编辑器 v0.1.0</p>
              <div style={{ textAlign: "left", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <p>基于 Tauri 2 + React 18 + CodeMirror 6</p>
                <p>支持 WikiLink、KaTeX 数学公式、代码高亮</p>
                <p>提供源码/分屏/预览三种编辑模式</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
