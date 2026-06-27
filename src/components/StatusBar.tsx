import { useMemo } from "react";
import { useStore, EditorMode } from "../lib/store";
import { getFileName } from "../lib/vault";

function countWords(text: string): { chars: number; words: number; lines: number } {
  const chars = text.length;
  const lines = text.split("\n").length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  return { chars, words, lines };
}

export function StatusBar() {
  const activeFile = useStore((s) => s.activeFile);
  const editorMode = useStore((s) => s.editorMode);
  const unsavedChanges = useStore((s) => s.unsavedChanges);
  const fileContents = useStore((s) => s.fileContents);
  const cursorPosition = useStore((s) => s.cursorPosition);
  const setEditorMode = useStore((s) => s.setEditorMode);
  const saveFile = useStore((s) => s.saveFile);

  const isDirty = activeFile ? activeFile in unsavedChanges : false;

  const content = useMemo(() => {
    if (!activeFile) return "";
    return unsavedChanges[activeFile] ?? fileContents[activeFile] ?? "";
  }, [activeFile, fileContents, unsavedChanges]);

  const stats = useMemo(() => countWords(content), [content]);

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
      </div>
      <div className="status-right">
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
      </div>
    </div>
  );
}
