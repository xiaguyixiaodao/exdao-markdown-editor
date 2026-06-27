export function formatMarkdown(src: string): string {
  let result = src;

  result = result.replace(/[ \t]+$/gm, "");

  result = result.replace(/\n{3,}/g, "\n\n");

  result = result.replace(/^(#{1,6})\s*(?!\s)/gm, "$1 ");

  result = result.replace(/^(>|[-*+])\s*(?!\s)/gm, "$1 ");

  result = result.replace(/^(\d+\.)\s*(?!\s)/gm, "$1 ");

  result = result.replace(/^- \[([ x])\]\s*(?!\s)/gm, "- [$1] ");

  result = result.replace(/^(#{1,6}\s+.+)$/gm, "\n$1");

  result = result.replace(/^\n+/, "");

  result = result.replace(/\n+$/, "\n");

  return result;
}
