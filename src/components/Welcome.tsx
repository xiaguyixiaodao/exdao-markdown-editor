import { useStore } from "../lib/store";
import { selectVaultDirectory } from "../lib/vault";

export function Welcome() {
  const openFolder = useStore((s) => s.openFolder);
  const setSidebarTab = useStore((s) => s.setSidebarTab);
  const recentVaults = useStore((s) => s.recentVaults);
  const removeRecent = useStore((s) => s.removeRecent);

  const handleNewDocument = async () => {
    await useStore.getState().createUntitled();
    useStore.setState({ sidebarOpen: false });
  };

  const handleOpenFileManager = () => {
    useStore.setState({ sidebarTab: "manager", sidebarOpen: true });
  };

  return (
    <div className="welcome">
      <div className="welcome-content">
        <h1 className="welcome-title">ExDao Editor</h1>
        <p className="welcome-subtitle">轻量级 Markdown 编辑器</p>
        <div className="welcome-actions">
          <button className="welcome-btn welcome-btn-secondary" onClick={handleNewDocument}>
            新建文档
          </button>
          <button className="welcome-btn" onClick={handleOpenFileManager}>
            打开文件管理器
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
