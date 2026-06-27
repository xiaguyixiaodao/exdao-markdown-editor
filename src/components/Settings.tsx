import { useStore } from "../lib/store";
import { selectVaultDirectory } from "../lib/vault";

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export function Settings({ open, onClose }: SettingsProps) {
  const rootPath = useStore((s) => s.rootPath);
  const openFolder = useStore((s) => s.openFolder);
  const editorWidth = useStore((s) => s.editorWidth);
  const setEditorWidth = useStore((s) => s.setEditorWidth);
  const autoSave = useStore((s) => s.autoSave);
  const setAutoSave = useStore((s) => s.setAutoSave);
  const formatOnSave = useStore((s) => s.formatOnSave);
  const setFormatOnSave = useStore((s) => s.setFormatOnSave);
  const customCss = useStore((s) => s.customCss);
  const setCustomCss = useStore((s) => s.setCustomCss);

  if (!open) return null;

  const handleSelectVault = async () => {
    const path = await selectVaultDirectory();
    if (path) {
      await openFolder(path);
      useStore.setState({ sidebarTab: "vault", sidebarOpen: true });
      onClose();
    }
  };

  const handleClearVault = async () => {
    useStore.setState({
      rootPath: null,
      fileTree: null,
      openFiles: [],
      activeFile: null,
      fileContents: {},
      unsavedChanges: {},
    });
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>设置</h2>
          <button className="settings-close" onClick={onClose}>&times;</button>
        </div>
        <div className="settings-body">
          <div className="settings-section">
            <h3>仓库设置</h3>
            <p className="settings-desc">设置 Obsidian 仓库路径，用于管理 Markdown 文件。</p>
            <div className="settings-row">
              <span className="settings-label">当前仓库：</span>
              <span className="settings-value" title={rootPath || ""}>
                {rootPath?.split(/[/\\]/).pop() || "未设置"}
              </span>
            </div>
            {rootPath && (
              <div className="settings-row">
                <span className="settings-label">路径：</span>
                <span className="settings-value settings-path">{rootPath}</span>
              </div>
            )}
            <div className="settings-actions">
              <button className="welcome-btn" style={{ fontSize: 13, padding: "6px 16px" }} onClick={handleSelectVault}>
                {rootPath ? "更换仓库" : "选择仓库"}
              </button>
              {rootPath && (
                <button className="welcome-btn welcome-btn-secondary" style={{ fontSize: 13, padding: "6px 16px" }} onClick={handleClearVault}>
                  移除仓库
                </button>
              )}
            </div>
          </div>
          <div className="settings-section">
            <h3>编辑器设置</h3>
            <div className="settings-row">
              <span className="settings-label">编辑器宽度：</span>
              <input
                className="settings-width-input"
                type="range"
                min={400}
                max={1920}
                step={10}
                value={editorWidth}
                onChange={(e) => setEditorWidth(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span className="settings-value" style={{ minWidth: 50 }}>{editorWidth}px</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">自动保存：</span>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  style={{ accentColor: "var(--accent)" }}
                />
                <span className="settings-value">{autoSave ? "已开启" : "已关闭"}</span>
              </label>
            </div>
            <div className="settings-row">
              <span className="settings-label">保存时格式化：</span>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formatOnSave}
                  onChange={(e) => setFormatOnSave(e.target.checked)}
                  style={{ accentColor: "var(--accent)" }}
                />
                <span className="settings-value">{formatOnSave ? "已开启" : "已关闭"}</span>
              </label>
            </div>
          </div>
          <div className="settings-section">
            <h3>自定义样式</h3>
            <p className="settings-desc">输入自定义 CSS 代码，实时生效。</p>
            <textarea
              className="settings-css-input"
              placeholder="/* 在此输入自定义 CSS */"
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
