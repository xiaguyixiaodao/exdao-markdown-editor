import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
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
import { saveHtml, exportToPdf } from "./lib/export";
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
  const spellCheck = useStore((s) => s.spellCheck);
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
  const recentFiles = useStore((s) => s.recentFiles);
  const fontSize = useStore((s) => s.fontSize);
  const setFontSize = useStore((s) => s.setFontSize);
  const previewScale = useStore((s) => s.previewScale);
  const setPreviewScale = useStore((s) => s.setPreviewScale);
  const toggleFullscreen = useStore((s) => s.toggleFullscreen);
  const toggleZenMode = useStore((s) => s.toggleZenMode);
  const typewriterMode = useStore((s) => s.typewriterMode);
  const toggleTypewriterMode = useStore((s) => s.toggleTypewriterMode);
  const isZenMode = useStore((s) => s.isZenMode);
  const zenModeRange = useStore((s) => s.zenModeRange);
  const setZenModeRange = useStore((s) => s.setZenModeRange);
  const sidebarWidth = useStore((s) => s.sidebarWidth);
  const setSidebarWidth = useStore((s) => s.setSidebarWidth);
  const [splitRatio, setSplitRatio] = useState(50);
  const splitDraggingRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const sidebarDraggingRef = useRef(false);

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
    try {
      const session = JSON.parse(localStorage.getItem("exdao_session") || "{}");
      if (session.vaultPath && session.openFiles?.length > 0) {
        useStore.getState().openFolder(session.vaultPath).then(async () => {
          for (const path of session.openFiles) {
            if (!path.startsWith("__untitled__")) {
              try { await useStore.getState().openFile(path); } catch {}
            }
          }
          if (session.activeFile) useStore.getState().setActiveFile(session.activeFile);
        }).catch(() => {});
      }
    } catch {}
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
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        useStore.getState().createUntitled();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        selectVaultDirectory().then((path) => {
          if (path) useStore.getState().openFolder(path);
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        const current = useStore.getState().activeFile;
        if (current) useStore.getState().closeFile(current);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setFontSize(useStore.getState().fontSize + 1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setFontSize(useStore.getState().fontSize - 1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setFontSize(15);
        setPreviewScale(1);
      }
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        toggleZenMode();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleQuickSwitcher, setEditorMode, toggleSidebar, toggleOutline, toggleFindReplace]);

  const handleOpenFolder = useCallback(async () => {
    const path = await selectVaultDirectory();
    if (path) await openFolder(path);
  }, [openFolder]);

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
    localStorage.setItem("exdao_session", JSON.stringify({
      vaultPath, openFiles, activeFile,
    }));
  }, [vaultPath, openFiles, activeFile]);

  const customCss = useStore((s) => s.customCss);
  const largeText = useStore((s) => s.largeText);
  const autoHideHeader = useStore((s) => s.autoHideHeader);

  useEffect(() => {
    let style = document.getElementById("exdao-custom-css") as HTMLStyleElement;
    if (!style) {
      style = document.createElement("style");
      style.id = "exdao-custom-css";
      document.head.appendChild(style);
    }
    style.textContent = customCss;
  }, [customCss]);

  useEffect(() => {
    if (largeText) {
      document.documentElement.style.setProperty("--editor-width", "560px");
      document.documentElement.style.fontSize = "17px";
    } else {
      document.documentElement.style.fontSize = "";
    }
  }, [largeText]);

  useEffect(() => {
    if (!autoSave || !activeFile) return;
    const isDirty = activeFile in unsavedChanges;
    if (!isDirty) return;
    const timer = setTimeout(() => {
      saveFile(activeFile);
    }, 2000);
    return () => clearTimeout(timer);
  }, [autoSave, activeFile, unsavedChanges, saveFile]);

  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    splitDraggingRef.current = true;
    const startX = e.clientX;
    const container = splitContainerRef.current;
    if (!container) return;
    const startRatio = splitRatio;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!splitDraggingRef.current || !container) return;
      const rect = container.getBoundingClientRect();
      const dx = ev.clientX - startX;
      const newRatio = Math.min(80, Math.max(20, startRatio + (dx / rect.width) * 100));
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      splitDraggingRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [splitRatio]);

  const handleSidebarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    sidebarDraggingRef.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!sidebarDraggingRef.current) return;
      const dx = ev.clientX - startX;
      setSidebarWidth(startWidth + dx);
    };

    const handleMouseUp = () => {
      sidebarDraggingRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [sidebarWidth, setSidebarWidth]);

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
    if (editorRef.current) {
      editorRef.current.scrollToLine(line);
    } else {
      const container = document.querySelector(".preview-container");
      if (container) {
        const blocks = container.querySelectorAll<HTMLElement>("[data-line]");
        let bestEl: HTMLElement | null = null;
        let bestLine = -1;
        for (const block of blocks) {
          const ln = Number(block.dataset.line);
          if (ln <= line && ln > bestLine) {
            bestLine = ln;
            bestEl = block;
          }
        }
        if (bestEl) {
          bestEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const state = useStore.getState();
    for (const file of files) {
      if (file.name.endsWith(".md") || file.name.endsWith(".markdown")) {
        const content = await file.text();
        if (state.rootPath) {
          const path = `${state.rootPath}/${file.name}`;
          await invoke("write_file", { path, content });
          await state.refreshFileTree();
          await state.openFile(path);
        } else {
          const path = `__untitled__/${file.name}`;
          useStore.setState((s) => ({
            openFiles: [...s.openFiles, path],
            fileContents: { ...s.fileContents, [path]: content },
            activeFile: path,
          }));
        }
      }
    }
  }, []);

  const menus = [
    {
      label: "文件",
      items: [
        { label: "新建文档", shortcut: "Ctrl+N", action: () => createUntitled() },
        { label: "打开仓库", shortcut: "Ctrl+O", action: handleOpenFolder },
        { divider: true as const, label: "" },
        {
          label: "最近打开",
          children: recentFiles.length > 0
            ? recentFiles.map((p) => ({
                label: p.split(/[/\\]/).pop() || p,
                action: () => openFile(p),
              }))
            : [{ label: "无最近文件", action: () => {} }],
        },
        { divider: true as const, label: "" },
        { label: "保存", shortcut: "Ctrl+S", action: handleSave, disabled: !activeFile },
        { label: "另存为...", shortcut: "Ctrl+Shift+S", action: () => saveFileAsDialog(), disabled: !activeFile },
        { divider: true as const, label: "" },
        { label: "关闭当前文件", shortcut: "Ctrl+W", action: () => activeFile && closeFile(activeFile), disabled: !activeFile },
        { label: "关闭所有文件", action: () => closeAllFiles(), disabled: openFiles.length === 0 },
        { divider: true as const, label: "" },
        {
          label: "导出为 HTML",
          action: async () => {
            if (!activeFile) return;
            const content = unsavedChanges[activeFile] ?? fileContents[activeFile] ?? "";
            const filename = activeFile.split(/[/\\]/).pop()?.replace(/\.md$/i, "") || "document";
            await saveHtml(content, filename);
          },
          disabled: !activeFile,
        },
        {
          label: "导出为 PDF",
          action: async () => {
            if (!activeFile) return;
            const content = unsavedChanges[activeFile] ?? fileContents[activeFile] ?? "";
            const filename = activeFile.split(/[/\\]/).pop()?.replace(/\.md$/i, "") || "document";
            await exportToPdf(content, filename);
          },
          disabled: !activeFile,
        },
        { divider: true as const, label: "" },
        {
          label: "关闭应用",
          action: () => {
            import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
              getCurrentWindow().close();
            });
          },
        },
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
              editorRef.current?.undo();
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
            } else {
              editorRef.current?.redo();
            }
          },
        },
        { divider: true as const, label: "" },
        { label: "查找", shortcut: "Ctrl+F", action: toggleFindReplace },
        { label: "替换", shortcut: "Ctrl+H", action: toggleFindReplace },
        { divider: true as const, label: "" },
        { label: `${wordWrap ? "关闭" : "开启"}自动换行`, action: toggleWordWrap },
        {
          label: `${useStore.getState().formatOnSave ? "关闭" : "开启"}保存时格式化`,
          action: () => useStore.getState().setFormatOnSave(!useStore.getState().formatOnSave),
        },
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
        {
          label: "字体放大",
          shortcut: "Ctrl++",
          action: () => setFontSize(useStore.getState().fontSize + 1),
        },
        {
          label: "字体缩小",
          shortcut: "Ctrl+-",
          action: () => setFontSize(useStore.getState().fontSize - 1),
        },
        {
          label: "重置字体大小",
          shortcut: "Ctrl+0",
          action: () => { setFontSize(15); setPreviewScale(1); },
        },
        { divider: true as const, label: "" },
        {
          label: `${useStore.getState().isFullscreen ? "✓ " : "  "}全屏模式`,
          shortcut: "F11",
          action: toggleFullscreen,
        },
        {
          label: `${useStore.getState().isZenMode ? "✓ " : "  "}专注模式`,
          shortcut: "Ctrl+\\",
          action: toggleZenMode,
        },
        {
          label: `${typewriterMode ? "✓ " : "  "}打字机模式`,
          action: toggleTypewriterMode,
        },
        { divider: true as const, label: "" },
        {
          label: "专注模式范围",
          children: [3, 5, 8, 10, 15].map((n) => ({
            label: `${zenModeRange === n ? "✓ " : "  "}${n} 行`,
            action: () => setZenModeRange(n),
          })),
        },
      ],
    },
    {
      label: "设置",
      items: [
        {
          label: `${autoSave ? "✓ " : "  "}自动保存`,
          action: () => useStore.getState().setAutoSave(!autoSave),
        },
        { label: "编辑器设置...", action: () => setSettingsOpen(true) },
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
        {
          label: "快捷键",
          children: [
            { label: "Ctrl+N  新建文档", action: () => {} },
            { label: "Ctrl+O  打开仓库", action: () => {} },
            { label: "Ctrl+S  保存", action: () => {} },
            { label: "Ctrl+Shift+S  另存为", action: () => {} },
            { label: "Ctrl+W  关闭当前文件", action: () => {} },
            { label: "Ctrl+E  切换编辑模式", action: () => {} },
            { label: "Ctrl+K  快速切换文件", action: () => {} },
            { label: "Ctrl+F  查找", action: () => {} },
            { label: "Ctrl+H  替换", action: () => {} },
            { label: "Ctrl+B  切换侧边栏", action: () => {} },
            { label: "Ctrl+J  切换大纲", action: () => {} },
            { label: "Ctrl+/-  字体缩放", action: () => {} },
            { label: "Ctrl+0  重置缩放", action: () => {} },
            { label: "Ctrl+\\  专注模式", action: () => {} },
            { label: "F11  全屏", action: () => {} },
          ],
        },
        { divider: true as const, label: "" },
        { label: "关于", action: () => setAboutOpen(true) },
      ],
    },
  ];

  return (
    <div className={`app-layout ${isZenMode ? "zen-mode" : ""} ${largeText ? "large-text" : ""} ${autoHideHeader ? "auto-hide-header" : ""}`}>
      <MenuBar menus={menus} />
      <div className="app-body">
        {sidebarOpen && (
          <>
            <div className="file-tree" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
              <FileTree />
            </div>
            <div
              className="sidebar-resize-handle"
              onMouseDown={handleSidebarMouseDown}
            />
          </>
        )}
        <div className="editor-area">
          <TabBar />
          {toolbarOpen && editorMode === "source" && <Toolbar />}
          {toolbarOpen && editorMode === "preview" && <WysiwygToolbar editor={tiptapEditor} />}
          <div
            className="editor-content"
            style={{ "--editor-width": `${editorWidth}px`, position: "relative" } as React.CSSProperties}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {findReplaceOpen && (
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
                    fontSize={fontSize}
                    typewriterMode={typewriterMode}
                    zenMode={isZenMode}
                    zenModeRange={zenModeRange}
                    spellCheck={spellCheck}
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
                    zenMode={isZenMode}
                    zenModeRange={zenModeRange}
                  />
                ) : (
                  <div className="editor-empty">
                    <p>选择一个文件开始编辑</p>
                  </div>
                )}
              </div>
            )}
            {editorMode === "split" && (
              <div ref={splitContainerRef} className="split-container" style={{ display: "flex", flex: 1 }}>
                <div className="editor-pane editor-pane-split" style={{ width: `${splitRatio}%`, flexShrink: 0 }}>
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
                      fontSize={fontSize}
                      typewriterMode={typewriterMode}
                      zenMode={isZenMode}
                      zenModeRange={zenModeRange}
                      spellCheck={spellCheck}
                    />
                  ) : (
                    <div className="editor-empty">
                      <p>选择一个文件开始编辑</p>
                    </div>
                  )}
                </div>
                <div
                  className="split-divider"
                  onMouseDown={handleSplitMouseDown}
                />
                <div className="preview-pane preview-pane-split" style={{ width: `${100 - splitRatio}%`, flexShrink: 0 }}>
                  <Preview
                    sourceScrollRatio={editorScrollRatio}
                    onSourceScroll={handlePreviewScrollAsRatio}
                    onNavigate={handleNavigate}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <Outline onJumpToLine={handleJumpToLine} />
      </div>
      <StatusBar />
      <QuickSwitcher />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {isZenMode && (
        <>
          <div className="zen-mode-hint" onClick={toggleZenMode} title="点击退出专注模式">
            Ctrl+\ 退出专注模式
          </div>
          <div className="zen-mode-win-controls">
            <button className="win-btn win-minimize" onClick={() => import("@tauri-apps/api/window").then(w => w.getCurrentWindow().minimize())} title="最小化">
              <svg width="8" height="1" viewBox="0 0 8 1"><rect width="8" height="1" fill="currentColor"/></svg>
            </button>
            <button className="win-btn win-maximize" onClick={() => import("@tauri-apps/api/window").then(w => w.getCurrentWindow().toggleMaximize())} title="最大化">
              <svg width="8" height="8" viewBox="0 0 8 8"><rect x="0.5" y="0.5" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1"/></svg>
            </button>
            <button className="win-btn win-close" onClick={() => import("@tauri-apps/api/window").then(w => w.getCurrentWindow().close())} title="关闭">
              <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1"/></svg>
            </button>
          </div>
        </>
      )}
      {aboutOpen && (
        <div className="settings-overlay" onClick={() => setAboutOpen(false)}>
          <div className="settings-dialog pref-dialog" onClick={(e) => e.stopPropagation()} style={{ width: 360 }}>
            <div className="settings-header">
              <h2>关于</h2>
              <button className="settings-close" onClick={() => setAboutOpen(false)}>&times;</button>
            </div>
            <div className="settings-body" style={{ textAlign: "center", padding: "24px 20px" }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-heading)", marginBottom: 4 }}>ExDao Editor</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>轻量级 Markdown 编辑器 v0.3.0</p>
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
