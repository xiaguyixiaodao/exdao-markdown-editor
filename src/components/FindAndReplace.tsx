import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "../lib/store";

interface FindAndReplaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FindAndReplace({ isOpen, onClose }: FindAndReplaceProps) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeFile = useStore((s) => s.activeFile);
  const unsavedChanges = useStore((s) => s.unsavedChanges);
  const fileContents = useStore((s) => s.fileContents);
  const updateContent = useStore((s) => s.updateContent);

  const content = activeFile
    ? unsavedChanges[activeFile] ?? fileContents[activeFile] ?? ""
    : "";

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setReplacement("");
      setMatchCount(0);
      setCurrentMatch(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = content.match(regex);
    setMatchCount(matches?.length ?? 0);
    setCurrentMatch(matches && matches.length > 0 ? 1 : 0);
  }, [query, content]);

  const findNext = useCallback(() => {
    if (matchCount === 0) return;
    setCurrentMatch((c) => (c >= matchCount ? 1 : c + 1));
  }, [matchCount]);

  const findPrev = useCallback(() => {
    if (matchCount === 0) return;
    setCurrentMatch((c) => (c <= 1 ? matchCount : c - 1));
  }, [matchCount]);

  const replaceCurrent = useCallback(() => {
    if (!activeFile || !query) return;
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    let matchIndex = 0;
    const newContent = content.replace(regex, (match) => {
      matchIndex++;
      if (matchIndex === currentMatch) {
        return replacement;
      }
      return match;
    });
    if (newContent !== content) {
      updateContent(activeFile, newContent);
    }
  }, [activeFile, query, replacement, currentMatch, content, updateContent]);

  const replaceAll = useCallback(() => {
    if (!activeFile || !query) return;
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const newContent = content.replace(regex, replacement);
    if (newContent !== content) {
      updateContent(activeFile, newContent);
    }
  }, [activeFile, query, replacement, content, updateContent]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          findPrev();
        } else {
          findNext();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, findNext, findPrev]);

  if (!isOpen) return null;

  return (
    <div className="find-replace-bar">
      <div className="find-replace-row">
        <input
          ref={inputRef}
          className="find-replace-input"
          placeholder="查找..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="find-replace-count">
          {matchCount > 0 ? `${currentMatch}/${matchCount}` : "无匹配"}
        </span>
        <button className="find-replace-btn" onClick={findPrev} title="上一个 (Shift+Enter)">▲</button>
        <button className="find-replace-btn" onClick={findNext} title="下一个 (Enter)">▼</button>
        <button className="find-replace-btn" onClick={onClose} title="关闭 (Esc)">✕</button>
      </div>
      <div className="find-replace-row">
        <input
          className="find-replace-input"
          placeholder="替换..."
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
        />
        <button
          className="find-replace-btn"
          onClick={replaceCurrent}
          disabled={matchCount === 0}
          title="替换当前"
        >
          替换
        </button>
        <button
          className="find-replace-btn"
          onClick={replaceAll}
          disabled={matchCount === 0}
          title="全部替换"
        >
          全部
        </button>
      </div>
    </div>
  );
}
