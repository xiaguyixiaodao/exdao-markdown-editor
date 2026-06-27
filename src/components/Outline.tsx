import { useMemo, useCallback } from "react";
import { useStore } from "../lib/store";
import { extractHeadings } from "../lib/markdown";

interface OutlineProps {
  onJumpToLine: (line: number) => void;
}

export function Outline({ onJumpToLine }: OutlineProps) {
  const activeFile = useStore((s) => s.activeFile);
  const fileContents = useStore((s) => s.fileContents);
  const unsavedChanges = useStore((s) => s.unsavedChanges);
  const outlineOpen = useStore((s) => s.outlineOpen);

  const content = useMemo(() => {
    if (!activeFile) return "";
    return unsavedChanges[activeFile] ?? fileContents[activeFile] ?? "";
  }, [activeFile, fileContents, unsavedChanges]);

  const headings = useMemo(() => extractHeadings(content), [content]);

  const handleClick = useCallback(
    (line: number) => {
      onJumpToLine(line);
    },
    [onJumpToLine]
  );

  if (!outlineOpen || !activeFile) return null;

  return (
    <div className="outline-panel">
      <div className="outline-header">大纲</div>
      <div className="outline-content">
        {headings.length === 0 && (
          <div className="outline-empty">暂无标题</div>
        )}
        {headings.map((h, i) => (
          <div
            key={i}
            className="outline-item"
            style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
            onClick={() => handleClick(h.line)}
          >
            <span className="outline-bullet">●</span>
            <span className="outline-text">{h.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
