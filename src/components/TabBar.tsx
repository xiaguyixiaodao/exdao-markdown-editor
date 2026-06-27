import { useStore } from "../lib/store";
import { getFileName } from "../lib/vault";

export function TabBar() {
  const openFiles = useStore((s) => s.openFiles);
  const activeFile = useStore((s) => s.activeFile);
  const unsavedChanges = useStore((s) => s.unsavedChanges);
  const setActiveFile = useStore((s) => s.setActiveFile);
  const closeFile = useStore((s) => s.closeFile);

  if (openFiles.length === 0) return null;

  return (
    <div className="tab-bar">
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
