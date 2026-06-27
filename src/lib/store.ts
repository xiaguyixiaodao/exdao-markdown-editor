import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

export type EditorMode = "source" | "preview" | "split";

const RECENT_KEY = "exdao_recent_vaults";
const SESSION_KEY = "exdao_session";
const MAX_RECENT = 10;

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

function loadSession(): { openFiles: string[]; activeFile: string | null } {
  try {
    const data = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
    return { openFiles: data.openFiles || [], activeFile: data.activeFile || null };
  } catch {
    return { openFiles: [], activeFile: null };
  }
}

function saveSession(openFiles: string[], activeFile: string | null) {
  const valid = openFiles.filter((f) => !f.startsWith("__untitled__/"));
  localStorage.setItem(SESSION_KEY, JSON.stringify({ openFiles: valid, activeFile }));
}

function addRecent(path: string) {
  const list = loadRecent().filter((p) => p !== path);
  list.unshift(path);
  if (list.length > MAX_RECENT) list.length = MAX_RECENT;
  saveRecent(list);
}

interface CursorPosition {
  line: number;
  column: number;
}

interface AppState {
  rootPath: string | null;
  fileTree: FileNode | null;
  openFiles: string[];
  activeFile: string | null;
  fileContents: Record<string, string>;
  unsavedChanges: Record<string, string>;
  editorMode: EditorMode;
  sidebarOpen: boolean;
  sidebarTab: "vault" | "manager";
  managerPath: string | null;
  managerTree: FileNode | null;
  outlineOpen: boolean;
  quickSwitcherOpen: boolean;
  recentVaults: string[];
  savedToDisk: Set<string>;
  browseRoot: string | null;
  browseTree: FileNode | null;
  toolbarOpen: boolean;
  wordWrap: boolean;
  editorWidth: number;
  theme: string;
  mdStyle: string;
  cursorPosition: CursorPosition;
  autoSave: boolean;
  findReplaceOpen: boolean;
  lastSaveTime: number | null;
  fontSize: number;
  previewScale: number;
  isFullscreen: boolean;
  isZenMode: boolean;
  formatOnSave: boolean;
  customCss: string;
  typewriterMode: boolean;
  zenModeRange: number;

  openFolder: (path: string) => Promise<void>;
  createUntitled: () => Promise<void>;
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  closeAllFiles: () => void;
  setActiveFile: (path: string) => void;
  updateContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;
  saveFileAs: (path: string) => Promise<void>;
  saveFileAsDialog: () => Promise<void>;
  createNewFile: (dirPath: string, fileName: string) => Promise<void>;
  createNewFolder: (dirPath: string, folderName: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  renameFile: (from: string, to: string) => Promise<void>;
  setEditorMode: (mode: EditorMode) => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: "vault" | "manager") => Promise<void>;
  setManagerPath: (path: string | null) => Promise<void>;
  toggleOutline: () => void;
  toggleToolbar: () => void;
  toggleWordWrap: () => void;
  setEditorWidth: (width: number) => void;
  toggleQuickSwitcher: () => void;
  setTheme: (name: string) => void;
  setMdStyle: (name: string) => void;
  refreshFileTree: () => Promise<void>;
  removeRecent: (path: string) => void;
  setBrowseRoot: (path: string) => Promise<void>;
  setCursorPosition: (pos: CursorPosition) => void;
  setAutoSave: (enabled: boolean) => void;
  toggleFindReplace: () => void;
  setFontSize: (size: number) => void;
  setPreviewScale: (scale: number) => void;
  toggleFullscreen: () => void;
  toggleZenMode: () => void;
  setFormatOnSave: (enabled: boolean) => void;
  setCustomCss: (css: string) => void;
  toggleTypewriterMode: () => void;
  setZenModeRange: (range: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  rootPath: null,
  fileTree: null,
  openFiles: [],
  activeFile: null,
  fileContents: {},
  unsavedChanges: {},
  editorMode: "preview",
  sidebarOpen: false,
  sidebarTab: "vault",
  managerPath: null,
  managerTree: null,
  outlineOpen: false,
  quickSwitcherOpen: false,
  recentVaults: loadRecent(),
  savedToDisk: new Set<string>(),
  browseRoot: null,
  browseTree: null,
  toolbarOpen: true,
  wordWrap: true,
  editorWidth: Number(localStorage.getItem("exdao_editor_width")) || 720,
  theme: localStorage.getItem("exdao_theme") || "system",
  mdStyle: localStorage.getItem("exdao_mdstyle") || "default",
  cursorPosition: { line: 1, column: 1 },
  autoSave: localStorage.getItem("exdao_auto_save") === "true",
  findReplaceOpen: false,
  lastSaveTime: null,
  fontSize: Number(localStorage.getItem("exdao_font_size")) || 15,
  previewScale: 1,
  isFullscreen: false,
  isZenMode: false,
  formatOnSave: localStorage.getItem("exdao_format_on_save") === "true",
  customCss: localStorage.getItem("exdao_custom_css") || "",
  typewriterMode: localStorage.getItem("exdao_typewriter") === "true",
  zenModeRange: Number(localStorage.getItem("exdao_zen_range")) || 5,

  openFolder: async (path: string) => {
    const tree = await invoke<FileNode>("open_vault", { path });
    addRecent(path);
    set({ rootPath: path, fileTree: tree, recentVaults: loadRecent() });
    await invoke("start_watching", { path });
  },

  createUntitled: async () => {
    const { openFiles, fileContents, browseRoot } = get();
    let name = "untitled.md";
    let i = 1;
    while (openFiles.some((f) => f.endsWith(`/${name}`))) {
      name = `untitled ${i++}.md`;
    }
    const path = `__untitled__/${name}`;
    set({
      openFiles: [...openFiles, path],
      fileContents: { ...fileContents, [path]: "" },
      activeFile: path,
    });
    if (!browseRoot) {
      const home = await invoke<string>("get_home_dir");
      const tree = await invoke<FileNode>("open_vault", { path: home });
      set({ browseRoot: home, browseTree: tree });
    }
  },

  openFile: async (path: string) => {
    const { openFiles, fileContents } = get();
    if (!openFiles.includes(path)) {
      const content = await invoke<string>("read_file", { path });
      set({
        openFiles: [...openFiles, path],
        fileContents: { ...fileContents, [path]: content },
        activeFile: path,
      });
    } else {
      set({ activeFile: path });
    }
  },

  closeFile: (path: string) => {
    const { openFiles, activeFile, fileContents, unsavedChanges } = get();
    const newOpen = openFiles.filter((f) => f !== path);
    const newContents = { ...fileContents };
    const newUnsaved = { ...unsavedChanges };
    delete newContents[path];
    delete newUnsaved[path];
    set({
      openFiles: newOpen,
      activeFile: activeFile === path ? (newOpen[0] || null) : activeFile,
      fileContents: newContents,
      unsavedChanges: newUnsaved,
    });
  },

  closeAllFiles: () => {
    set({
      openFiles: [],
      activeFile: null,
      fileContents: {},
      unsavedChanges: {},
    });
  },

  setActiveFile: (path: string) => set({ activeFile: path }),

  updateContent: (path: string, content: string) => {
    const { unsavedChanges, fileContents } = get();
    const original = fileContents[path];
    const newUnsaved = { ...unsavedChanges };
    if (content === original) {
      delete newUnsaved[path];
    } else {
      newUnsaved[path] = content;
    }
    set({ unsavedChanges: newUnsaved });
  },

  saveFile: async (path: string) => {
    if (path.startsWith("__untitled__/")) {
      const { selectNewFilePath } = await import("./vault");
      const newPath = await selectNewFilePath();
      if (!newPath) return;
      await get().saveFileAs(newPath);
      return;
    }
    const { unsavedChanges, formatOnSave } = get();
    let content = unsavedChanges[path] ?? get().fileContents[path];
    if (content !== undefined) {
      if (formatOnSave) {
        const { formatMarkdown } = await import("./format");
        content = formatMarkdown(content);
      }
      await invoke("write_file", { path, content });
      const { fileContents, savedToDisk } = get();
      const newUnsaved = { ...unsavedChanges };
      delete newUnsaved[path];
      savedToDisk.add(path);
      set({
        fileContents: { ...fileContents, [path]: content },
        unsavedChanges: newUnsaved,
        lastSaveTime: Date.now(),
      });
    }
  },

  saveFileAsDialog: async () => {
    const { activeFile } = get();
    if (!activeFile) return;
    const { selectNewFilePath } = await import("./vault");
    const newPath = await selectNewFilePath();
    if (!newPath) return;
    await get().saveFileAs(newPath);
  },

  saveFileAs: async (path: string) => {
    const { activeFile, unsavedChanges, fileContents } = get();
    if (!activeFile) return;
    const content = unsavedChanges[activeFile] ?? fileContents[activeFile] ?? "";
    await invoke("write_file", { path, content });
    const { openFiles, savedToDisk } = get();
    const newOpen = openFiles.map((f) => (f === activeFile ? path : f));
    const newContents = { ...fileContents };
    const newUnsaved = { ...unsavedChanges };
    delete newContents[activeFile];
    delete newUnsaved[activeFile];
    newContents[path] = content;
    savedToDisk.add(path);
    set({
      openFiles: newOpen,
      activeFile: path,
      fileContents: newContents,
      unsavedChanges: newUnsaved,
    });
    if (activeFile.startsWith("__untitled__/")) {
      return;
    }
    await get().refreshFileTree();
  },

  createNewFile: async (dirPath: string, fileName: string) => {
    const sep = dirPath.includes("\\") ? "\\" : "/";
    const path = dirPath.endsWith(sep) ? dirPath + fileName : dirPath + sep + fileName;
    await invoke("create_file", { path, content: "" });
    await get().refreshFileTree();
    await get().openFile(path);
  },

  createNewFolder: async (dirPath: string, folderName: string) => {
    const sep = dirPath.includes("\\") ? "\\" : "/";
    const path = dirPath.endsWith(sep) ? dirPath + folderName : dirPath + sep + folderName;
    await invoke("create_file", { path: path + sep + ".keep", content: "" });
    await get().refreshFileTree();
  },

  deleteFile: async (path: string) => {
    await invoke("delete_file", { path });
    get().closeFile(path);
    await get().refreshFileTree();
  },

  renameFile: async (from: string, to: string) => {
    await invoke("rename_file", { from, to });
    const { openFiles, fileContents, unsavedChanges } = get();
    const idx = openFiles.indexOf(from);
    if (idx !== -1) {
      const newOpen = [...openFiles];
      newOpen[idx] = to;
      const newContents = { ...fileContents };
      const newUnsaved = { ...unsavedChanges };
      if (from in newContents) {
        newContents[to] = newContents[from];
        delete newContents[from];
      }
      if (from in newUnsaved) {
        newUnsaved[to] = newUnsaved[from];
        delete newUnsaved[from];
      }
      set({
        openFiles: newOpen,
        activeFile: get().activeFile === from ? to : get().activeFile,
        fileContents: newContents,
        unsavedChanges: newUnsaved,
      });
    }
    await get().refreshFileTree();
  },

  setEditorMode: (mode: EditorMode) => set({ editorMode: mode }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarTab: async (tab) => {
    set({ sidebarTab: tab, sidebarOpen: true });
    if (tab === "manager" && !get().managerTree) {
      const home = await invoke<string>("get_home_dir");
      const candidates = [
        `${home}/Documents`,
        `${home}/文档`,
        `${home}`,
      ];
      for (const p of candidates) {
        try {
          const tree = await invoke<FileNode>("open_directory", { path: p });
          if (tree.children && tree.children.length > 0) {
            set({ managerPath: p, managerTree: tree });
            return;
          }
        } catch { /* try next */ }
      }
      const fallback = candidates[0];
      try {
        const tree = await invoke<FileNode>("open_directory", { path: fallback });
        set({ managerPath: fallback, managerTree: tree });
      } catch { /* give up */ }
    }
  },
  setManagerPath: async (path) => {
    const tree = await invoke<FileNode>("open_directory", { path });
    set({ managerPath: path, managerTree: tree, sidebarTab: "manager", sidebarOpen: true });
  },
  toggleOutline: () => set((s) => ({ outlineOpen: !s.outlineOpen })),
  toggleToolbar: () => set((s) => ({ toolbarOpen: !s.toolbarOpen })),
  toggleWordWrap: () => set((s) => ({ wordWrap: !s.wordWrap })),
  setEditorWidth: (width) => {
    localStorage.setItem("exdao_editor_width", String(width));
    set({ editorWidth: width });
  },
  setTheme: (name: string) => {
    localStorage.setItem("exdao_theme", name);
    set({ theme: name });
  },
  setMdStyle: (name: string) => {
    localStorage.setItem("exdao_mdstyle", name);
    set({ mdStyle: name });
  },
  toggleQuickSwitcher: () =>
    set((s) => ({ quickSwitcherOpen: !s.quickSwitcherOpen })),

  refreshFileTree: async () => {
    const { rootPath } = get();
    if (rootPath) {
      const tree = await invoke<FileNode>("open_vault", { path: rootPath });
      set({ fileTree: tree });
    }
  },

  removeRecent: (path: string) => {
    const list = loadRecent().filter((p) => p !== path);
    saveRecent(list);
    set({ recentVaults: list });
  },

  setBrowseRoot: async (path: string) => {
    const tree = await invoke<FileNode>("open_vault", { path });
    set({ browseRoot: path, browseTree: tree });
  },

  setCursorPosition: (pos: CursorPosition) => set({ cursorPosition: pos }),

  setAutoSave: (enabled: boolean) => {
    localStorage.setItem("exdao_auto_save", String(enabled));
    set({ autoSave: enabled });
  },

  toggleFindReplace: () => set((s) => ({ findReplaceOpen: !s.findReplaceOpen })),

  setFontSize: (size: number) => {
    const clamped = Math.min(32, Math.max(10, size));
    localStorage.setItem("exdao_font_size", String(clamped));
    set({ fontSize: clamped });
  },

  setPreviewScale: (scale: number) => {
    const clamped = Math.min(2, Math.max(0.5, scale));
    set({ previewScale: clamped });
  },

  toggleFullscreen: () => {
    const isFullscreen = !get().isFullscreen;
    if (isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    set({ isFullscreen });
  },

  toggleZenMode: () => set((s) => ({ isZenMode: !s.isZenMode })),

  setFormatOnSave: (enabled: boolean) => {
    localStorage.setItem("exdao_format_on_save", String(enabled));
    set({ formatOnSave: enabled });
  },

  setCustomCss: (css: string) => {
    localStorage.setItem("exdao_custom_css", css);
    set({ customCss: css });
  },

  toggleTypewriterMode: () => {
    const next = !get().typewriterMode;
    localStorage.setItem("exdao_typewriter", String(next));
    set({ typewriterMode: next });
  },

  setZenModeRange: (range: number) => {
    const clamped = Math.min(20, Math.max(1, range));
    localStorage.setItem("exdao_zen_range", String(clamped));
    set({ zenModeRange: clamped });
  },
}));

export function setupFileWatcher() {
  listen<{ event: string; path: string }>("vault:event", () => {
    useStore.getState().refreshFileTree();
  });
}
