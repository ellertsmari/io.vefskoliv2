/**
 * A guide's topic list as short tags for a gallery card. Teachers write the
 * list in Markdown or in HTML (`<p>Things to Google:</p><ul><li>…</li></ul>`),
 * so tags are stripped before splitting; the HTML used to come through as
 * literal text ("#<ul>"), and "&amp;" was cut in two at its semicolon.
 */

const BLOCK_TAG = /<\/?(?:p|ul|ol|li|br|div|h[1-6])\b[^>]*>/gi;
const ANY_TAG = /<[^>]+>/g;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

const decodeEntities = (text: string): string =>
  text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity]);

/** Splits on newlines, commas and semicolons, but not inside parentheses. */
const splitTopics = (text: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth++;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "\n" || (depth === 0 && (char === "," || char === ";"))) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
};

export const parseTopics = (topicsList?: string): string[] =>
  splitTopics(
    decodeEntities(
      (topicsList ?? "").replace(BLOCK_TAG, "\n").replace(ANY_TAG, "")
    )
  )
    .map((topic) =>
      topic
        .trim()
        .replace(/^#{1,6}\s+/, "")
        .replace(/^(?:[-*+]|\d+[.)])\s+/, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`~]/g, "")
        .trim()
    )
    // "Things to Google:" introduces a list; it is not a topic itself.
    .filter((topic) => topic && !topic.endsWith(":"));
