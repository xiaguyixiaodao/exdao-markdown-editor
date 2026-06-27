import { useStore } from "../lib/store";
import { selectVaultDirectory } from "../lib/vault";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface WelcomeProps {
  onOpenSettings?: () => void;
}

export function Welcome({ onOpenSettings }: WelcomeProps) {
  const openFolder = useStore((s) => s.openFolder);
  const rootPath = useStore((s) => s.rootPath);
  const recentVaults = useStore((s) => s.recentVaults);
  const removeRecent = useStore((s) => s.removeRecent);

  const handleNewFile = async () => {
    const { openFiles, fileContents, browseRoot } = useStore.getState();
    let name = "untitled.md";
    let i = 1;
    while (openFiles.some((f) => f.endsWith(`/${name}`))) {
      name = `untitled ${i++}.md`;
    }
    const path = `__untitled__/${name}`;
    useStore.setState({
      openFiles: [...openFiles, path],
      fileContents: { ...fileContents, [path]: "" },
      activeFile: path,
      sidebarTab: "manager",
      sidebarOpen: true,
    });
  };

  const handleOpenVault = async () => {
    if (rootPath) {
      useStore.setState({ sidebarTab: "vault", sidebarOpen: true });
    } else {
      onOpenSettings?.();
    }
  };

  const handleOpenFolder = async () => {
    const path = await selectVaultDirectory();
    if (path) {
      useStore.getState().setManagerPath(path);
      useStore.setState({ sidebarTab: "manager", sidebarOpen: true });
    }
  };

  const win = getCurrentWindow();

  return (
    <div className="welcome">
      <div className="welcome-titlebar" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
        <span className="welcome-titlebar-text">ExDao Editor</span>
        <div className="window-controls" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <button className="win-btn win-minimize" onClick={() => win.minimize()} title="最小化">
            <svg width="8" height="1" viewBox="0 0 8 1"><rect width="8" height="1" fill="currentColor"/></svg>
          </button>
          <button className="win-btn win-maximize" onClick={() => win.toggleMaximize()} title="最大化">
            <svg width="8" height="8" viewBox="0 0 8 8"><rect x="0.5" y="0.5" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1"/></svg>
          </button>
          <button className="win-btn win-close" onClick={() => win.close()} title="关闭">
            <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1"/></svg>
          </button>
        </div>
      </div>
      <div className="welcome-content">
        <h1 className="welcome-title">ExDao Editor</h1>
        <p className="welcome-subtitle">轻量级 Markdown 编辑器</p>
        <div className="welcome-actions">
          <button className="welcome-btn" onClick={handleNewFile}>
            新建文件
          </button>
          <button className="welcome-btn" onClick={handleOpenVault}>
            打开仓库
          </button>
          <button className="welcome-btn" onClick={handleOpenFolder}>
            打开文件夹
          </button>
        </div>
        {recentVaults.length > 0 && (
          <div className="welcome-recent">
            <h3>最近访问</h3>
            {recentVaults.map((p) => (
              <div key={p} className="recent-item" onClick={() => openFolder(p)}>
                <span className="recent-icon">&#128193;</span>
                <span className="recent-name">{p.split(/[/\\]/).pop()}</span>
                <span className="recent-path">{p}</span>
                <button
                  className="recent-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecent(p);
                  }}
                  title="移除"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
