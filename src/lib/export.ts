import { renderMarkdown } from "./markdown";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-shell";
import { tempDir } from "@tauri-apps/api/path";

export function exportToHtml(markdown: string, title: string): string {
  const htmlContent = renderMarkdown(markdown);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.3;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
    h3 { font-size: 1.25em; }
    p { margin: 0.8em 0; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: #f6f8fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.9em;
    }
    pre {
      background: #f6f8fa;
      border: 1px solid #e1e4e8;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1em 0;
    }
    pre code {
      background: none;
      padding: 12px 16px;
      display: block;
      font-size: 13px;
      line-height: 1.5;
    }
    blockquote {
      border-left: 4px solid #dfe2e5;
      padding: 0.5em 1em;
      margin: 1em 0;
      color: #6a737d;
      background: #f6f8fa;
      border-radius: 0 4px 4px 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #dfe2e5;
      padding: 8px 12px;
      text-align: left;
    }
    th { background: #f6f8fa; font-weight: 600; }
    tr:nth-child(even) { background: #f6f8fa; }
    img { max-width: 100%; border-radius: 6px; }
    hr { border: none; border-top: 1px solid #e1e4e8; margin: 1.5em 0; }
    ul, ol { padding-left: 2em; margin: 0.8em 0; }
    li { margin: 0.3em 0; }
    .katex-display { margin: 1em 0; text-align: center; overflow-x: auto; }
    .code-block-wrapper { margin: 1em 0; }
    .code-block-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      background: #f6f8fa;
      border: 1px solid #e1e4e8;
      border-bottom: none;
      border-radius: 6px 6px 0 0;
      font-size: 12px;
      color: #6a737d;
    }
    .code-block-wrapper pre { margin-top: 0; border-top-left-radius: 0; border-top-right-radius: 0; }
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
</head>
<body>
${htmlContent}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function saveHtml(markdown: string, title: string) {
  const html = exportToHtml(markdown, title);
  const path = await save({
    defaultPath: `${title}.html`,
    filters: [{ name: "HTML", extensions: ["html"] }],
  });
  if (path) {
    await writeTextFile(path, html);
  }
}

export async function exportToPdf(markdown: string, title: string) {
  const html = exportToHtml(markdown, title);
  const dir = await tempDir();
  const sep = dir.includes("\\") ? "\\" : "/";
  const tmpPath = `${dir}${sep}${title}.html`;
  await writeTextFile(tmpPath, html);
  await open(tmpPath);
}
