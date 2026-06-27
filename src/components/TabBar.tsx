import { useRef, useCallback } from "react";
import { useStore } from "../lib/store";
import { getFileName } from "../lib/vault";

export function TabBar() {
  const openFiles = useStore((s) => s.openFiles);
  const activeFile = useStore((s) => s.activeFile);
  const unsavedChanges = useStore((s) => s.unsavedChanges);
  const setActiveFile = useStore((s) => s.setActiveFile);
  const closeFile = useStore((s) => s.closeFile);
  const closeAllFiles = useStore((s) => s.closeAllFiles);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  if (openFiles.length === 0) return null;

  return (
    <div className="tab-bar" ref={scrollRef} onWheel={handleWheel}>
      {openFiles.map((path) => {
        const isActive = path === activeFile;
        const isDirty = path in unsavedChanges;
        return (
          <div
            key={path}
            className={`tab ${isActive ? "tab-active" : ""}`}
            title={path}
            onClick={() => setActiveFile(path)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                closeFile(path);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              const others = openFiles.filter((f) => f !== path);
              const menu = document.createElement("div");
              menu.className = "context-menu";
              menu.style.left = `${e.clientX}px`;
              menu.style.top = `${e.clientY}px`;

              const addBtn = (label: string, action: () => void) => {
                const btn = document.createElement("button");
                btn.className = "context-menu-item";
                btn.textContent = label;
                btn.onclick = () => { menu.remove(); action(); };
                menu.appendChild(btn);
              };

              addBtn("关闭", () => closeFile(path));
              if (others.length > 0) {
                addBtn("关闭其他", () => others.forEach((f) => closeFile(f)));
              }
              if (openFiles.length > 1) {
                addBtn("关闭所有", () => closeAllFiles());
              }

              document.body.appendChild(menu);
              const close = (ev: MouseEvent) => {
                if (!menu.contains(ev.target as Node)) { menu.remove(); document.removeEventListener("mousedown", close); }
              };
              setTimeout(() => document.addEventListener("mousedown", close), 0);
            }}
          >
            <span className={`tab-name ${isDirty ? "tab-dirty" : ""}`}>
              {getFileName(path)}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(path);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
