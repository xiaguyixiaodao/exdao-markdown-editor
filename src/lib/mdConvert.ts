import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import TurndownService from "turndown";

const md2html = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

md2html.use(taskLists, { enabled: true, label: true, labelAfter: true });

const html2md = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

html2md.addRule("taskListItem", {
  filter: (node) => {
    if (node.nodeName !== "LI") return false;
    if (node.getAttribute("data-type") === "taskItem") return true;
    if (node.classList?.contains("task-list-item")) return true;
    const parent = node.parentNode as HTMLElement | null;
    if (parent && (parent.classList?.contains("task-list") || parent.getAttribute("data-type") === "taskList")) return true;
    if (node.querySelector('input[type="checkbox"]')) return true;
    return false;
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    const checked = checkbox?.checked ?? el.getAttribute("data-checked") === "true";
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("input, label").forEach((inp) => inp.remove());
    const text = (clone.textContent || "").trim();
    return `- [${checked ? "x" : " "}] ${text}\n`;
  },
});

html2md.addRule("table", {
  filter: "table",
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const rows: string[][] = [];
    const trs = el.querySelectorAll("tr");
    trs.forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll("th, td").forEach((cell) => {
        cells.push((cell.textContent || "").replace(/\|/g, "\\|").trim());
      });
      rows.push(cells);
    });
    if (rows.length === 0) return "";
    const header = rows[0];
    const sep = header.map(() => "---");
    const lines = [header.join(" | "), sep.join(" | ")];
    for (let i = 1; i < rows.length; i++) {
      lines.push(rows[i].join(" | "));
    }
    return "\n" + lines.join("\n") + "\n";
  },
});

export function markdownToHtml(md: string): string {
  const raw = md2html.render(md);

  const withTiPTapAttrs = raw
    .replace(
      /<ul class="contains-task-list">/g,
      '<ul data-type="taskList">'
    )
    .replace(
      /<li class="task-list-item(?:\s+enabled)?"?>/g,
      (_match, _offset, full) => {
        const liStart = full.indexOf("<li", _offset);
        const liTagEnd = full.indexOf(">", liStart);
        const closeLi = full.indexOf("</li>", liStart);
        const liContent = full.substring(liTagEnd + 1, closeLi);
        const checked = liContent.includes("checked");
        return `<li data-type="taskItem" data-checked="${checked}">`;
      }
    );

  return withTiPTapAttrs
    .replace(
      /<input[^>]*class="task-list-item-checkbox"[^>]*>/g,
      ""
    )
    .replace(
      /<label class="task-list-item-label"\s*(?:for="[^"]*"\s*)?>([\s\S]*?)<\/label>/g,
      (_match, inner) => `<label><input type="checkbox"></label><div><p>${inner.trim()}</p></div>`
    );
}

export function htmlToMarkdown(html: string): string {
  const result = html2md.turndown(html);
  return result
    .replace(/^- \\\[([ x])\\\] /gm, "- [$1] ")
    .replace(/^- \\\[([ x])\\\) /gm, "- [$1] ")
    .replace(/^- \[\\([ x])\\] /gm, "- [$1] ")
    .replace(/^- \\?\[([ x])\\?\] /gm, "- [$1] ");
}
