import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { useStore } from "../lib/store";
import { renderMarkdown } from "../lib/markdown";

interface PreviewProps {
  sourceScrollRatio?: number;
  onSourceScroll?: (ratio: number) => void;
  onNavigate?: (target: string) => void;
  onEdit?: () => void;
}

export function Preview({ sourceScrollRatio, onSourceScroll, onNavigate, onEdit }: PreviewProps) {
  const activeFile = useStore((s) => s.activeFile);
  const fileContents = useStore((s) => s.fileContents);
  const unsavedChanges = useStore((s) => s.unsavedChanges);
  const previewScale = useStore((s) => s.previewScale);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const [debouncedContent, setDebouncedContent] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const rawContent = useMemo(() => {
    if (!activeFile) return "";
    return unsavedChanges[activeFile] ?? fileContents[activeFile] ?? "";
  }, [activeFile, fileContents, unsavedChanges]);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedContent(rawContent);
    }, 150);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [rawContent]);

  const html = useMemo(() => renderMarkdown(debouncedContent), [debouncedContent]);

  useEffect(() => {
    if (sourceScrollRatio === undefined || !containerRef.current || syncingRef.current) return;
    syncingRef.current = true;
    const el = containerRef.current;
    const blocks = el.querySelectorAll<HTMLElement>("[data-line]");
    if (blocks.length === 0) {
      const maxScroll = el.scrollHeight - el.clientHeight;
      el.scrollTop = sourceScrollRatio * maxScroll;
    } else {
      const totalLines = debouncedContent.split("\n").length;
      const targetLine = sourceScrollRatio * (totalLines - 1);
      let bestEl: HTMLElement | null = null;
      let bestLine = -1;
      for (const block of blocks) {
        const ln = Number(block.dataset.line);
        if (ln <= targetLine && ln > bestLine) {
          bestLine = ln;
          bestEl = block;
        }
      }
      if (bestEl) {
        const nextEl = bestEl.nextElementSibling as HTMLElement | null;
        const nextLine = nextEl?.dataset.line ? Number(nextEl.dataset.line) : totalLines;
        const lineRange = nextLine - bestLine || 1;
        const ratio = (targetLine - bestLine) / lineRange;
        const baseOffset = bestEl.offsetTop;
        const nextOffset = nextEl ? nextEl.offsetTop : el.scrollHeight;
        el.scrollTop = baseOffset + ratio * (nextOffset - baseOffset) - el.clientHeight * 0.3;
      }
    }
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, [sourceScrollRatio, debouncedContent]);

  const handleScroll = useCallback(() => {
    if (!onSourceScroll || !containerRef.current || syncingRef.current) return;
    syncingRef.current = true;
    const el = containerRef.current;
    const blocks = el.querySelectorAll<HTMLElement>("[data-line]");
    if (blocks.length === 0) {
      const ratio = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
      onSourceScroll(ratio);
    } else {
      const scrollTop = el.scrollTop;
      let bestEl: HTMLElement | null = null;
      for (const block of blocks) {
        if (block.offsetTop <= scrollTop + 10) {
          bestEl = block;
        } else break;
      }
      if (bestEl) {
        const line = Number(bestEl.dataset.line);
        const totalLines = debouncedContent.split("\n").length;
        onSourceScroll(line / (totalLines - 1 || 1));
      }
    }
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, [onSourceScroll, debouncedContent]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onNavigate) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a.cm-wikilink") as HTMLAnchorElement | null;
      if (link) {
        e.preventDefault();
        const linkTarget = link.dataset.target;
        if (linkTarget) onNavigate(linkTarget);
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [onNavigate]);

  if (!activeFile) {
    return (
      <div className="preview-empty">
        <p>选择一个文件开始编辑</p>
      </div>
    );
  }

  return (
    <div className="preview-wrapper">
      <div
        ref={containerRef}
        className="preview-container"
        onScroll={handleScroll}
        style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: `${100 / previewScale}%` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {onEdit && (
        <button className="preview-edit-btn" onClick={onEdit} title="编辑 (Esc 退出)">
          &#9998; 编辑
        </button>
      )}
    </div>
  );
}
