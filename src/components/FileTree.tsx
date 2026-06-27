import { useState, useCallback, useRef, useEffect, memo } from "react";
import { useStore, FileNode } from "../lib/store";
import { getFileName, selectVaultDirectory } from "../lib/vault";

interface ContextMenuState {
  x: number;
  y: number;
  node: FileNode;
}

function filterTree(node: FileNode, query: string): FileNode | null {
  if (!query) return node;
  const q = query.toLowerCase();
  if (!node.is_dir) {
    return node.name.toLowerCase().includes(q) ? node : null;
  }
  const filteredChildren = node.children
    ?.map((child) => filterTree(child, query))
    .filter((c): c is FileNode => c !== null);
  if (filteredChildren && filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }
  return node.name.toLowerCase().includes(q) ? node : null;
}

function ContextMenu({ x, y, node, onClose }: { x: number; y: number; node: FileNode; onClose: () => void }) {
  const openFile = useStore((s) => s.openFile);
  const deleteFile = useStore((s) => s.deleteFile);
  const renameFile = useStore((s) => s.renameFile);
  const createNewFile = useStore((s) => s.createNewFile);
  const createNewFolder = useStore((s) => s.createNewFolder);
  const menuRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleRename = async () => {
    onClose();
    const newName = prompt("输入新名称:", node.name);
    if (!newName || newName === node.name) return;
    const parts = node.path.split(/[/\\]/);
    parts[parts.length - 1] = newName;
    const newPath = parts.join("/");
    await renameFile(node.path, newPath);
  };

  const handleDelete = async () => {
    onClose();
    const type = node.is_dir ? "文件夹" : "文件";
    if (confirm(`确定删除${type}「${node.name}」？此操作不可撤销。`)) {
      await deleteFile(node.path);
    }
  };

  const handleNewFile = async () => {
    onClose();
    const name = prompt("输入文件名:", "新文件.md");
    if (!name) return;
    const dirPath = node.is_dir ? node.path : node.path.split(/[/\\]/).slice(0, -1).join("/");
    await createNewFile(dirPath, name);
  };

  const handleNewFolder = async () => {
    onClose();
    const name = prompt("输入文件夹名:");
    if (!name) return;
    const dirPath = node.is_dir ? node.path : node.path.split(/[/\\]/).slice(0, -1).join("/");
    await createNewFolder(dirPath, name);
  };

  const handleCopyPath = async () => {
    onClose();
    try {
      await navigator.clipboard.writeText(node.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleCopyName = async () => {
    onClose();
    try {
      await navigator.clipboard.writeText(node.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: x, top: y }}
    >
      {!node.is_dir && (
        <button className="context-menu-item" onClick={() => { onClose(); openFile(node.path); }}>
          打开
        </button>
      )}
      <button className="context-menu-item" onClick={handleNewFile}>新建文件</button>
      <button className="context-menu-item" onClick={handleNewFolder}>新建文件夹</button>
      <div className="context-menu-divider" />
      <button className="context-menu-item" onClick={handleCopyPath}>
        {copied ? "已复制路径 ✓" : "复制路径"}
      </button>
      <button className="context-menu-item" onClick={handleCopyName}>
        复制文件名
      </button>
      <div className="context-menu-divider" />
      <button className="context-menu-item" onClick={handleRename}>重命名</button>
      <button className="context-menu-item context-menu-danger" onClick={handleDelete}>删除</button>
    </div>
  );
}

const TreeNode = memo(function TreeNode({
  node,
  depth,
  onFileClick,
}: {
  node: FileNode;
  depth: number;
  onFileClick: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const activeFile = useStore((s) => s.activeFile);

  const handleClick = useCallback(() => {
    if (node.is_dir) {
      setExpanded((e) => !e);
    } else {
      onFileClick(node.path);
    }
  }, [node, onFileClick]);

  const isActive = !node.is_dir && activeFile === node.path;

  return (
    <>
      <div
        className={`tree-node ${isActive ? "tree-node-active" : ""}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const event = new CustomEvent("tree-context-menu", {
            detail: { x: e.clientX, y: e.clientY, node },
            bubbles: true,
          });
          e.currentTarget.dispatchEvent(event);
        }}
      >
        {node.is_dir ? (
          <span className={`tree-arrow ${expanded ? "tree-arrow-expanded" : ""}`}>
            ▶
          </span>
        ) : (
          <span className="tree-icon">
            {node.name.endsWith(".md") || node.name.endsWith(".markdown") ? "📝" : "📄"}
          </span>
        )}
        <span className="tree-name">{node.name}</span>
      </div>
      {node.is_dir && expanded && node.children?.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          onFileClick={onFileClick}
        />
      ))}
    </>
  );
});

export function FileTree() {
  const openFile = useStore((s) => s.openFile);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const sidebarTab = useStore((s) => s.sidebarTab);
  const managerPath = useStore((s) => s.managerPath);
  const managerTree = useStore((s) => s.managerTree);
  const rootPath = useStore((s) => s.rootPath);
  const fileTree = useStore((s) => s.fileTree);
  const setSidebarTab = useStore((s) => s.setSidebarTab);
  const setManagerPath = useStore((s) => s.setManagerPath);
  const [managerInput, setManagerInput] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const displayTree = sidebarTab === "vault"
    ? (searchQuery ? filterTree(fileTree!, searchQuery) : fileTree)
    : (searchQuery && managerTree ? filterTree(managerTree, searchQuery) : managerTree);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setContextMenu({ x: detail.x, y: detail.y, node: detail.node });
    };
    document.addEventListener("tree-context-menu", handler as EventListener);
    return () => document.removeEventListener("tree-context-menu", handler as EventListener);
  }, []);

  const handleManagerSelectDir = useCallback(async () => {
    const path = await selectVaultDirectory();
    if (path) {
      setManagerPath(path);
      setManagerInput(path);
    }
  }, [setManagerPath]);

  const handleManagerInputConfirm = useCallback(async () => {
    const trimmed = managerInput.trim();
    if (trimmed) {
      setManagerPath(trimmed);
    }
  }, [managerInput, setManagerPath]);

  const handleManagerInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManagerInputConfirm();
    }
  }, [handleManagerInputConfirm]);

  if (!sidebarOpen) return null;

  return (
    <div className="file-tree">
      <div className="file-tree-tabs">
        <button
          className={`file-tree-tab ${sidebarTab === "vault" ? "file-tree-tab-active" : ""}`}
          onClick={() => { setSidebarTab("vault"); setSearchQuery(""); }}
        >
          仓库
        </button>
        <button
          className={`file-tree-tab ${sidebarTab === "manager" ? "file-tree-tab-active" : ""}`}
          onClick={() => { setSidebarTab("manager"); setSearchQuery(""); }}
        >
          文件管理器
        </button>
      </div>
      <div className="file-tree-search">
        <input
          ref={searchInputRef}
          className="file-tree-search-input"
          type="text"
          placeholder="搜索文件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="file-tree-search-clear" onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}>
            ×
          </button>
        )}
      </div>
      {sidebarTab === "vault" ? (
        <div className="file-tree-content">
          {rootPath && fileTree ? (
            <>
              {!searchQuery && (
                <div className="tree-root-label" title={rootPath}>
                  {rootPath.split(/[/\\]/).pop() || "仓库"}
                </div>
              )}
              {displayTree ? (
                <TreeNode node={displayTree} depth={0} onFileClick={openFile} />
              ) : (
                <div className="tree-empty">
                  <p>未找到匹配的文件</p>
                </div>
              )}
            </>
          ) : (
            <div className="tree-empty">
              <p>请在菜单栏「文件 → 设置」中配置仓库路径</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="manager-toolbar">
            <input
              className="manager-path-input"
              type="text"
              value={managerInput || managerPath || ""}
              placeholder="输入路径后按回车..."
              onChange={(e) => setManagerInput(e.target.value)}
              onKeyDown={handleManagerInputKeyDown}
              onBlur={handleManagerInputConfirm}
            />
            <button className="icon-btn" onClick={handleManagerSelectDir} title="选择目录">
              📂
            </button>
          </div>
          <div className="file-tree-content">
            {displayTree ? (
              <>
                {!searchQuery && (
                  <div className="tree-root-label" title={managerPath || ""}>
                    {managerPath?.split(/[/\\]/).pop() || "文档"}
                  </div>
                )}
                <TreeNode node={displayTree} depth={0} onFileClick={openFile} />
              </>
            ) : (
              <div className="tree-empty">
                {searchQuery ? <p>未找到匹配的文件</p> : <p>无法加载目录</p>}
              </div>
            )}
          </div>
        </>
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export { getFileName };
