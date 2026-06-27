import { useMemo, useState, useEffect } from "react";
import { useStore, EditorMode } from "../lib/store";
import { getFileName } from "../lib/vault";
import { extractTags } from "../lib/markdown";

function countWords(text: string): { chars: number; words: number; lines: number; readTime: string } {
  const chars = text.length;
  const lines = text.split("\n").length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const readMin = Math.max(1, Math.ceil(words / 200));
  const readTime = words === 0 ? "" : readMin < 1 ? "不到 1 分钟" : `约 ${readMin} 分钟`;
  return { chars, words, lines, readTime };
}

function formatSaveTime(timestamp: number | null): string {
  if (!timestamp) return "";
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 5) return "刚刚";
  if (diff < 60) return `${diff}秒前`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `${min}分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}小时前`;
  return `${Math.floor(hour / 24)}天前`;
}

export function StatusBar() {
  const activeFile = useStore((s) => s.activeFile);
  const editorMode = useStore((s) => s.editorMode);
  const unsavedChanges = useStore((s) => s.unsavedChanges);
  const fileContents = useStore((s) => s.fileContents);
  const cursorPosition = useStore((s) => s.cursorPosition);
  const lastSaveTime = useStore((s) => s.lastSaveTime);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const setEditorMode = useStore((s) => s.setEditorMode);
  const saveFile = useStore((s) => s.saveFile);

  const [saveDisplay, setSaveDisplay] = useState("");
  const isDirty = activeFile ? activeFile in unsavedChanges : false;

  useEffect(() => {
    const update = () => setSaveDisplay(formatSaveTime(lastSaveTime));
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, [lastSaveTime]);

  const content = useMemo(() => {
    if (!activeFile) return "";
    return unsavedChanges[activeFile] ?? fileContents[activeFile] ?? "";
  }, [activeFile, fileContents, unsavedChanges]);

  const stats = useMemo(() => countWords(content), [content]);
  const tags = useMemo(() => extractTags(content), [content]);

  const modes: EditorMode[] = ["source", "split", "preview"];

  return (
    <div className="status-bar">
      <div className="status-left">
        {activeFile && (
          <>
            <span className="status-item">
              {getFileName(activeFile)}
            </span>
            {isDirty && <span className="status-dot">●</span>}
          </>
        )}
        {activeFile && editorMode !== "preview" && (
          <span className="status-item">
            行 {cursorPosition.line}, 列 {cursorPosition.column}
          </span>
        )}
        {activeFile && (
          <span className="status-item">
            {stats.chars} 字符 / {stats.words} 词 / {stats.lines} 行
          </span>
        )}
        {activeFile && stats.readTime && (
          <span className="status-item">
            阅读 {stats.readTime}
          </span>
        )}
        {activeFile && tags.length > 0 && (
          <span className="status-item status-tags" title={tags.join(", ")}>
            #{tags.slice(0, 3).join(" #")}{tags.length > 3 ? ` +${tags.length - 3}` : ""}
          </span>
        )}
      </div>
      <div className="status-right">
        <button
          className="status-item status-theme-toggle"
          onClick={() => {
            if (theme === "system") {
              setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark");
            } else {
              setTheme(theme === "dark" ? "light" : "dark");
            }
          }}
          title={`切换到${theme === "dark" ? "浅色" : "深色"}主题`}
        >
          {theme === "dark" ? "☀" : theme === "light" ? "☾" : "💻"}
        </button>
        <div className="mode-switcher">
          {modes.map((m) => (
            <button
              key={m}
              className={`mode-btn ${editorMode === m ? "mode-btn-active" : ""}`}
              onClick={() => setEditorMode(m)}
            >
              {m === "source" ? "源码" : m === "split" ? "分屏" : "预览"}
            </button>
          ))}
        </div>
        {activeFile && (
          <button
            className="status-item status-save"
            onClick={() => saveFile(activeFile)}
            disabled={!isDirty}
          >
            {isDirty ? "保存" : "已保存"}
          </button>
        )}
        {activeFile && !isDirty && saveDisplay && (
          <span className="status-item status-save-time">
            {saveDisplay}
          </span>
        )}
      </div>
    </div>
  );
}
