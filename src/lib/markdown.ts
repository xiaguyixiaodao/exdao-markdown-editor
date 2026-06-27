import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import katex from "katex";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

md.use(taskLists, { enabled: true, label: true, labelAfter: true });

md.inline.ruler.push("wikilink", (state, silent) => {
  const src = state.src;
  const pos = state.pos;
  if (src.charCodeAt(pos) !== 0x5b || src.charCodeAt(pos + 1) !== 0x5b) {
    return false;
  }
  const end = src.indexOf("]]", pos);
  if (end === -1) return false;
  if (silent) return true;

  const content = src.slice(pos + 2, end);
  const parts = content.split("|");
  const target = parts[0].trim();
  const alias = parts.length > 1 ? parts[1].trim() : target;

  const token = state.push("wikilink_open", "a", 1);
  token.attrs = [
    ["class", "cm-wikilink"],
    ["data-target", target],
    ["href", "#"],
  ];

  const text = state.push("text", "", 0);
  text.content = alias;

  state.push("wikilink_close", "a", -1);
  state.pos = end + 2;
  return true;
});

md.inline.ruler.push("image_wikilink", (state, silent) => {
  const src = state.src;
  const pos = state.pos;
  if (
    src.charCodeAt(pos) !== 0x21 ||
    src.charCodeAt(pos + 1) !== 0x5b ||
    src.charCodeAt(pos + 2) !== 0x5b
  ) {
    return false;
  }
  const end = src.indexOf("]]", pos);
  if (end === -1) return false;
  if (silent) return true;

  const target = src.slice(pos + 3, end).trim();

  const token = state.push("image_wikilink", "img", 0);
  token.attrs = [
    ["class", "cm-image-embed"],
    ["data-src", target],
    ["alt", target],
  ];
  token.content = target;

  state.pos = end + 2;
  return true;
});

md.inline.ruler.push("katex_inline", (state, silent) => {
  const src = state.src;
  const pos = state.pos;
  if (src.charCodeAt(pos) !== 0x24 || src.charCodeAt(pos + 1) === 0x24) {
    return false;
  }
  const end = src.indexOf("$", pos + 1);
  if (end === -1 || end === pos + 1) return false;
  if (silent) return true;

  const content = src.slice(pos + 1, end);
  try {
    const html = katex.renderToString(content, { throwOnError: false, displayMode: false });
    const token = state.push("katex_inline", "span", 0);
    token.content = html;
    token.markup = "$";
  } catch {
    return false;
  }

  state.pos = end + 1;
  return true;
});

md.block.ruler.push("katex_block", (state, startLine, endLine, silent) => {
  const startPos = state.bMarks[startLine] + state.tShift[startLine];
  const maxPos = state.eMarks[startLine];
  const lineText = state.src.slice(startPos, maxPos);

  if (!lineText.startsWith("$$")) return false;

  let nextLine = startLine + 1;
  let found = false;
  while (nextLine < endLine) {
    const nextPos = state.bMarks[nextLine] + state.tShift[nextLine];
    const nextMax = state.eMarks[nextLine];
    const nextText = state.src.slice(nextPos, nextMax);
    if (nextText.trim() === "$$") {
      found = true;
      break;
    }
    nextLine++;
  }

  if (!found) return false;
  if (silent) return true;

  const content = state.src.slice(
    state.bMarks[startLine + 1] + state.tShift[startLine + 1],
    state.eMarks[nextLine - 1]
  );

  try {
    const html = katex.renderToString(content.trim(), { throwOnError: false, displayMode: true });
    const token = state.push("katex_block", "div", 0);
    token.content = html;
    token.markup = "$$";
    token.map = [startLine, nextLine + 1];
    token.attrSet("class", "katex-display");
  } catch {
    return false;
  }

  state.line = nextLine + 1;
  return true;
});

md.renderer.rules.katex_inline = (tokens) => tokens[0].content;
md.renderer.rules.katex_block = (tokens) =>
  `<div class="katex-display" data-line="${tokens[0].map?.[0] ?? 0}">${tokens[0].content}</div>`;

md.core.ruler.push("line_numbers", (state) => {
  state.tokens.forEach((token) => {
    if (token.map && token.nesting === 0 && !token.attrGet("data-line")) {
      token.attrSet("data-line", String(token.map[0]));
    }
  });
});

const defaultFence =
  md.renderer.rules.fence ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const info = token.info.trim();
  const langLabel = info || "text";

  const highlighted = defaultFence(tokens, idx, options, env, self);
  const lineAttr = token.map ? ` data-line="${token.map[0]}"` : "";

  return `<div class="code-block-wrapper"${lineAttr}>
    <div class="code-block-header">
      <span class="code-block-lang">${langLabel}</span>
      <button class="code-block-copy" onclick="navigator.clipboard.writeText(this.closest('.code-block-wrapper').querySelector('code').textContent)">复制</button>
    </div>
    ${highlighted}
  </div>`;
};

md.renderer.rules.image_wikilink = (tokens, idx, _options, env) => {
  const token = tokens[idx];
  const src = token.attrGet("data-src") || "";
  const alt = token.content;
  const resolvedSrc =
    env && typeof env === "object" && "resolveImage" in env
      ? (env as { resolveImage: (s: string) => string }).resolveImage(src)
      : src;
  return `<img src="${resolvedSrc}" alt="${alt}" class="cm-image-embed" />`;
};

export function renderMarkdown(
  src: string,
  env?: Record<string, unknown>
): string {
  return md.render(src, env || {});
}

export function extractHeadings(
  src: string
): { level: number; text: string; line: number }[] {
  const headings: { level: number; text: string; line: number }[] = [];
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2]
          .replace(/\*\*(.+?)\*\*/g, "$1")
          .replace(/\*(.+?)\*/g, "$1"),
        line: i,
      });
    }
  }
  return headings;
}

export function extractTags(src: string): string[] {
  const tagSet = new Set<string>();
  const regex = /(?:^|\s)#([a-zA-Z\u4e00-\u9fa5][\w\u4e00-\u9fa5-]*)/g;
  let match;
  while ((match = regex.exec(src)) !== null) {
    tagSet.add(match[1]);
  }
  return Array.from(tagSet).sort();
}
