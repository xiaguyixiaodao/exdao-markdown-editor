import { useState, useRef, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

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
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="menu-dropdown-item-wrapper"
      ref={ref}
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

function MenuDropdown({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  return (
    <div className="menu-dropdown">
      {items.map((item, j) =>
        item.divider ? (
          <div key={j} className="menu-divider" />
        ) : item.children ? (
          <SubMenu key={j} item={item} onClose={onClose} />
        ) : (
          <button
            key={j}
            className={`menu-dropdown-item ${item.disabled ? "menu-disabled" : ""}`}
            onClick={() => {
              if (item.disabled) return;
              onClose();
              item.action?.();
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="menu-shortcut">{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  );
}

export function MenuBar({ menus }: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openMenu === null) return;
    const handle = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [openMenu]);

  const handleMenuClick = useCallback((idx: number) => {
    setOpenMenu((prev) => (prev === idx ? null : idx));
  }, []);

  const handleClose = useCallback(() => setOpenMenu(null), []);

  const win = getCurrentWindow();

  return (
    <div className="menu-bar" ref={barRef}>
      {menus.map((menu, i) => (
        <div key={menu.label} className="menu-item-wrapper">
          <button
            className={`menu-trigger ${openMenu === i ? "menu-trigger-active" : ""}`}
            onMouseDown={() => handleMenuClick(i)}
            onMouseEnter={() => openMenu !== null && setOpenMenu(i)}
          >
            {menu.label}
          </button>
          {openMenu === i && (
            <MenuDropdown items={menu.items} onClose={handleClose} />
          )}
        </div>
      ))}
      <div className="window-controls">
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
  );
}
