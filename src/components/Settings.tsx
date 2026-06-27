import { useStore, MarkdownFormat } from "../lib/store";
import { selectVaultDirectory } from "../lib/vault";

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

const markdownFormats: { value: MarkdownFormat; label: string }[] = [
  { value: "pandoc", label: "Pandoc's Markdown" },
  { value: "commonmark", label: "CommonMark" },
  { value: "gfm", label: "GitHub Flavored Markdown" },
  { value: "multimarkdown", label: "MultiMarkdown" },
  { value: "plain", label: "纯文本 Markdown" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`pref-toggle ${checked ? "pref-toggle-on" : ""}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="pref-toggle-thumb" />
    </button>
  );
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
  const spellCheck = useStore((s) => s.spellCheck);
  const setSpellCheck = useStore((s) => s.setSpellCheck);
  const autoHideHeader = useStore((s) => s.autoHideHeader);
  const setAutoHideHeader = useStore((s) => s.setAutoHideHeader);
  const largeText = useStore((s) => s.largeText);
  const setLargeText = useStore((s) => s.setLargeText);
  const markdownFormat = useStore((s) => s.markdownFormat);
  const setMarkdownFormat = useStore((s) => s.setMarkdownFormat);

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
      <div className="settings-dialog pref-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>首选项</h2>
          <button className="settings-close" onClick={onClose}>&times;</button>
        </div>
        <div className="settings-body">
          <div className="pref-list">
            <div className="pref-item">
              <div className="pref-item-content">
                <div className="pref-item-label">检查拼写</div>
                <div className="pref-item-desc">输入时自动检查拼写错误</div>
              </div>
              <Toggle checked={spellCheck} onChange={setSpellCheck} />
            </div>

            <div className="pref-item">
              <div className="pref-item-content">
                <div className="pref-item-label">自动隐藏标题栏</div>
                <div className="pref-item-desc">在输入时自动隐藏标题栏和状态栏</div>
              </div>
              <Toggle checked={autoHideHeader} onChange={setAutoHideHeader} />
            </div>

            <div className="pref-item">
              <div className="pref-item-content">
                <div className="pref-item-label">大号文本</div>
                <div className="pref-item-desc">如果可能则减小边界宽度并增大文字大小</div>
              </div>
              <Toggle checked={largeText} onChange={setLargeText} />
            </div>

            <div className="pref-item">
              <div className="pref-item-content">
                <div className="pref-item-label">输入格式</div>
                <div className="pref-item-desc">编辑器将使用的 Markdown 风格</div>
              </div>
              <select
                className="pref-select"
                value={markdownFormat}
                onChange={(e) => setMarkdownFormat(e.target.value as MarkdownFormat)}
              >
                {markdownFormats.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pref-divider" />

          <div className="pref-list">
            <div className="pref-item">
              <div className="pref-item-content">
                <div className="pref-item-label">自动保存</div>
                <div className="pref-item-desc">修改后自动保存文件</div>
              </div>
              <Toggle checked={autoSave} onChange={setAutoSave} />
            </div>

            <div className="pref-item">
              <div className="pref-item-content">
                <div className="pref-item-label">保存时格式化</div>
                <div className="pref-item-desc">保存时自动格式化 Markdown 内容</div>
              </div>
              <Toggle checked={formatOnSave} onChange={setFormatOnSave} />
            </div>

            <div className="pref-item">
              <div className="pref-item-content">
                <div className="pref-item-label">编辑器宽度</div>
                <div className="pref-item-desc">设置编辑区域的最大宽度</div>
              </div>
              <div className="pref-item-right">
                <input
                  className="pref-range"
                  type="range"
                  min={400}
                  max={1920}
                  step={10}
                  value={editorWidth}
                  onChange={(e) => setEditorWidth(Number(e.target.value))}
                />
                <span className="pref-range-value">{editorWidth}px</span>
              </div>
            </div>
          </div>

          <div className="pref-divider" />

          <div className="pref-list">
            <div className="pref-item-section">
              <div className="pref-item-label">仓库设置</div>
            </div>
            <div className="pref-item">
              <div className="pref-item-content">
                <div className="pref-item-label">当前仓库</div>
                <div className="pref-item-desc settings-path" title={rootPath || ""}>
                  {rootPath?.split(/[/\\]/).pop() || "未设置"}
                </div>
              </div>
              <div className="pref-item-right">
                <button className="pref-btn" onClick={handleSelectVault}>
                  {rootPath ? "更换" : "选择"}
                </button>
                {rootPath && (
                  <button className="pref-btn pref-btn-secondary" onClick={handleClearVault}>
                    移除
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pref-divider" />

          <div className="pref-list">
            <div className="pref-item-section">
              <div className="pref-item-label">自定义样式</div>
            </div>
            <div className="pref-item pref-item-block">
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
    </div>
  );
}
