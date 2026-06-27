import { useState, useRef, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useStore } from "../lib/store";
import { selectVaultDirectory } from "../lib/vault";

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
  disabled?: boolean;
  children?: MenuItem[];
}

interface MenuDef {
  label: string;
  items: MenuItem[];
}

interface MenuBarProps {
  menus: MenuDef[];
}

function SubMenu({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="menu-dropdown-item-wrapper"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="menu-dropdown-item">
        <span>{item.label}</span>
        <span className="menu-submenu-arrow">&#9656;</span>
      </button>
      {open && item.children && (
        <div className="menu-dropdown menu-submenu">
          {item.children.map((child, j) =>
            child.divider ? (
              <div key={j} className="menu-divider" />
            ) : (
              <button
                key={j}
                className={`menu-dropdown-item ${child.disabled ? "menu-disabled" : ""}`}
                onClick={() => {
                  if (child.disabled) return;
                  onClose();
                  child.action?.();
                }}
              >
                <span>{child.label}</span>
                {child.shortcut && (
                  <span className="menu-shortcut">{child.shortcut}</span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function MenuBar({ menus }: MenuBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<number | null>(null);
  const [openDropdownOpen, setOpenDropdownOpen] = useState(false);
  const [saveDropdownOpen, setSaveDropdownOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLDivElement>(null);
  const saveBtnRef = useRef<HTMLDivElement>(null);
  const activeFile = useStore((s) => s.activeFile);
  const unsavedChanges = useStore((s) => s.unsavedChanges);
  const saveFile = useStore((s) => s.saveFile);
  const saveFileAsDialog = useStore((s) => s.saveFileAsDialog);
  const recentFiles = useStore((s) => s.recentFiles);
  const openFile = useStore((s) => s.openFile);
  const autoHideHeader = useStore((s) => s.autoHideHeader);
  const [isHovering, setIsHovering] = useState(false);

  const isHeaderVisible = !autoHideHeader || isHovering || menuOpen || openDropdownOpen || saveDropdownOpen;

  useEffect(() => {
    if (!menuOpen && !openDropdownOpen && !saveDropdownOpen) return;
    const handle = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setOpenDropdownOpen(false);
        setSaveDropdownOpen(false);
        setExpandedMenu(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen, openDropdownOpen, saveDropdownOpen]);

  const handleClose = useCallback(() => {
    setMenuOpen(false);
    setOpenDropdownOpen(false);
    setSaveDropdownOpen(false);
    setExpandedMenu(null);
  }, []);

  const handleOpen = useCallback(async () => {
    handleClose();
    const path = await selectVaultDirectory();
    if (path) await useStore.getState().openFolder(path);
  }, [handleClose]);

  const handleSave = useCallback(() => {
    handleClose();
    if (activeFile) saveFile(activeFile);
  }, [activeFile, saveFile, handleClose]);

  const handleSaveAs = useCallback(() => {
    handleClose();
    saveFileAsDialog();
  }, [handleClose, saveFileAsDialog]);

  const isDirty = activeFile ? activeFile in unsavedChanges : false;
  const fileName = activeFile
    ? activeFile.split(/[/\\]/).pop()?.replace(/\.md$/i, "") || "未命名"
    : "新建文件";

  const win = getCurrentWindow();

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item, j) => {
      if (item.divider) {
        return <div key={j} className="menu-divider" />;
      }
      if (item.children) {
        return <SubMenu key={j} item={item} onClose={handleClose} />;
      }
      return (
        <button
          key={j}
          className={`menu-dropdown-item ${item.disabled ? "menu-disabled" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (item.disabled) return;
            handleClose();
            item.action?.();
          }}
        >
          <span>{item.label}</span>
          {item.shortcut && (
            <span className="menu-shortcut">{item.shortcut}</span>
          )}
        </button>
      );
    });
  };

  return (
    <div
      className={`menu-bar ${autoHideHeader ? "menu-bar-autohide" : ""} ${isHeaderVisible ? "" : "menu-bar-hidden"}`}
      ref={barRef}
      onMouseEnter={() => autoHideHeader && setIsHovering(true)}
      onMouseLeave={() => autoHideHeader && setIsHovering(false)}
    >
      <div className="header-left">
        <div className="header-action-group" ref={openBtnRef}>
          <button className="header-action-btn header-action-main" onClick={handleOpen} title="打开文件夹 (Ctrl+O)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>打开(O)</span>
          </button>
          <button className="header-action-arrow" onClick={() => { setOpenDropdownOpen(!openDropdownOpen); setSaveDropdownOpen(false); setMenuOpen(false); }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <path d="M1 3l3 3 3-3z"/>
            </svg>
          </button>
          {openDropdownOpen && (
            <div className="header-dropdown">
              <button className="header-dropdown-item" onClick={handleOpen}>
                <span>打开文件夹...</span>
                <span className="menu-shortcut">Ctrl+O</span>
              </button>
              {recentFiles.length > 0 && <div className="menu-divider" />}
              {recentFiles.length > 0 && (
                <div className="header-dropdown-label">最近文件</div>
              )}
              {recentFiles.slice(0, 8).map((path) => (
                <button
                  key={path}
                  className="header-dropdown-item"
                  onClick={() => { handleClose(); openFile(path); }}
                >
                  <span className="header-dropdown-filename">{path.split(/[/\\]/).pop()}</span>
                  <span className="header-dropdown-path">{path}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="header-action-group" ref={saveBtnRef}>
          <button className="header-action-btn header-action-main" onClick={handleSave} disabled={!activeFile} title="保存 (Ctrl+S)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            <span>保存(S)</span>
          </button>
          <button className="header-action-arrow" onClick={() => { setSaveDropdownOpen(!saveDropdownOpen); setOpenDropdownOpen(false); setMenuOpen(false); }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <path d="M1 3l3 3 3-3z"/>
            </svg>
          </button>
          {saveDropdownOpen && (
            <div className="header-dropdown">
              <button className="header-dropdown-item" onClick={handleSave} disabled={!activeFile}>
                <span>保存</span>
                <span className="menu-shortcut">Ctrl+S</span>
              </button>
              <button className="header-dropdown-item" onClick={handleSaveAs} disabled={!activeFile}>
                <span>另存为...</span>
                <span className="menu-shortcut">Ctrl+Shift+S</span>
              </button>
              <div className="menu-divider" />
              <button className="header-dropdown-item" onClick={() => { handleClose(); useStore.getState().createUntitled(); }}>
                <span>新建文件</span>
                <span className="menu-shortcut">Ctrl+N</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="header-center">
        <span className="header-title">
          {fileName}
          {isDirty && <span className="header-dirty">●</span>}
        </span>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" title="新建文件 (Ctrl+N)" onClick={() => { handleClose(); useStore.getState().createUntitled(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </button>
        <button className="header-icon-btn" title="搜索 (Ctrl+F)" onClick={() => useStore.getState().toggleFindReplace()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <button className="header-icon-btn" title="大纲 (Ctrl+J)" onClick={() => useStore.getState().toggleOutline()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>
        <button className={`header-icon-btn ${menuOpen ? "header-icon-btn-active" : ""}`} title="菜单" onClick={() => {
          setMenuOpen(!menuOpen);
          setExpandedMenu(null);
          setOpenDropdownOpen(false);
          setSaveDropdownOpen(false);
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="header-divider" />
        <button className="header-icon-btn" onClick={() => win.minimize()} title="最小化">
          <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
        </button>
        <button className="header-icon-btn" onClick={() => win.toggleMaximize()} title="最大化">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1"/>
          </svg>
        </button>
        <button className="header-icon-btn header-close-btn" onClick={() => win.close()} title="关闭">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1"/>
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="menu-panel">
          {menus.map((menu, i) => (
            <div key={menu.label} className="menu-panel-section">
              <button
                className={`menu-panel-category ${expandedMenu === i ? "menu-panel-category-active" : ""}`}
                onClick={() => setExpandedMenu(expandedMenu === i ? null : i)}
              >
                <span>{menu.label}</span>
                <span className={`menu-panel-arrow ${expandedMenu === i ? "menu-panel-arrow-open" : ""}`}>&#9656;</span>
              </button>
              {expandedMenu === i && (
                <div className="menu-panel-items">
                  {renderMenuItems(menu.items)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
