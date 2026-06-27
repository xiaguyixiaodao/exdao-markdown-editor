import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";

export async function selectVaultDirectory(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false });
  return selected ? String(selected) : null;
}

export async function selectNewFilePath(): Promise<string | null> {
  const selected = await save({
    defaultPath: "untitled.md",
    filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
  });
  return selected ? String(selected) : null;
}

export async function resolveWikiLink(
  vaultPath: string,
  target: string
): Promise<string | null> {
  const result = await invoke<string | null>("resolve_wikilink", {
    vaultPath,
    linkTarget: target,
  });
  return result;
}

export function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

export function getDirPath(path: string): string {
  const parts = path.split(/[/\\]/);
  parts.pop();
  return parts.join("/");
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

export function buildPath(...parts: string[]): string {
  return parts
    .map((p, i) => {
      if (i === 0) return p.replace(/[/\\]+$/, "");
      return p.replace(/^[/\\]+|[/\\]+$/g, "");
    })
    .filter(Boolean)
    .join("/");
}
