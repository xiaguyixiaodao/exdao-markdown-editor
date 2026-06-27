import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useStore, FileNode } from "../lib/store";
import { getFileName } from "../lib/vault";

const fileCache = new Map<FileNode, FileNode[]>();

function flattenFiles(node: FileNode | null): FileNode[] {
  if (!node) return [];
  if (fileCache.has(node)) return fileCache.get(node)!;
  const result: FileNode[] = [];
  if (!node.is_dir) {
    result.push(node);
  }
  node.children?.forEach((child) => {
    result.push(...flattenFiles(child));
  });
  fileCache.set(node, result);
  return result;
}

export function QuickSwitcher() {
  const isOpen = useStore((s) => s.quickSwitcherOpen);
  const fileTree = useStore((s) => s.fileTree);
  const openFile = useStore((s) => s.openFile);
  const toggleQuickSwitcher = useStore((s) => s.toggleQuickSwitcher);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allFiles = useMemo(() => {
    fileCache.clear();
    return flattenFiles(fileTree);
  }, [fileTree]);

  const filtered = useMemo(() => {
    if (!query) return allFiles.slice(0, 20);
    const q = query.toLowerCase();
    return allFiles
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [allFiles, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        toggleQuickSwitcher();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        openFile(filtered[selectedIndex].path);
        toggleQuickSwitcher();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, filtered, selectedIndex, openFile, toggleQuickSwitcher]);

  if (!isOpen) return null;

  return (
    <div className="quick-switcher-overlay" onClick={toggleQuickSwitcher}>
      <div className="quick-switcher" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="quick-switcher-input"
          placeholder="搜索文件..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
        />
        <div className="quick-switcher-results">
          {filtered.map((file, i) => (
            <div
              key={file.path}
              className={`quick-switcher-item ${i === selectedIndex ? "quick-switcher-item-active" : ""}`}
              onClick={() => {
                openFile(file.path);
                toggleQuickSwitcher();
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="qs-icon">📝</span>
              <span className="qs-name">{getFileName(file.path)}</span>
              <span className="qs-path">{file.path}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="quick-switcher-empty">未找到文件</div>
          )}
        </div>
      </div>
    </div>
  );
}
