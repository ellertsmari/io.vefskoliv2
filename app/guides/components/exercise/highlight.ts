/**
 * A very small TypeScript highlighter for the exercise editor.
 *
 * Hand-rolled rather than pulled from a library because the client bundle is
 * deliberately kept clear of anything compiler-shaped, and this only ever sees
 * beginner code: declarations, calls, strings, comments. It produces HTML for
 * a layer sitting behind a transparent textarea, so if it ever mis-colours
 * something the text is still exactly what the student typed — the textarea
 * remains the source of truth and nothing depends on this being perfect.
 */

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "do", "of", "in", "switch", "case", "default", "break", "continue", "new",
  "class", "extends", "typeof", "instanceof", "null", "undefined", "true",
  "false", "void", "type", "interface", "import", "export", "from", "as",
  "async", "await", "try", "catch", "finally", "throw", "this",
]);

const TYPES = new Set([
  "string", "number", "boolean", "any", "unknown", "never", "object", "symbol",
  "bigint", "Array", "Record", "Promise", "Map", "Set",
]);

export type TokenKind =
  | "comment"
  | "string"
  | "template"
  | "number"
  | "keyword"
  | "type"
  | "plain";

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Order matters: comments and strings first, so a `//` inside a string is not
 * read as a comment and a keyword inside a comment is not read as a keyword.
 */
const TOKEN = new RegExp(
  [
    "(\\/\\/[^\\n]*)", // line comment
    "(\\/\\*[\\s\\S]*?(?:\\*\\/|$))", // block comment, unterminated tolerated
    "(`(?:\\\\.|[^\\\\`])*`?)", // template literal
    "('(?:\\\\.|[^\\\\'\\n])*'?|\"(?:\\\\.|[^\\\\\"\\n])*\"?)", // string
    "(\\b\\d[\\d_]*(?:\\.\\d+)?\\b)", // number
    "([A-Za-z_$][\\w$]*)", // identifier — classified below
  ].join("|"),
  "g"
);

/** Split into (kind, text) pairs. Exported for testing. */
export const tokenize = (code: string): [TokenKind, string][] => {
  const out: [TokenKind, string][] = [];
  let lastIndex = 0;

  for (const match of code.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) out.push(["plain", code.slice(lastIndex, start)]);

    const [text, lineComment, blockComment, template, str, num, word] = match;
    if (lineComment || blockComment) out.push(["comment", text]);
    else if (template) out.push(["template", text]);
    else if (str) out.push(["string", text]);
    else if (num) out.push(["number", text]);
    else if (word) {
      out.push([
        KEYWORDS.has(word) ? "keyword" : TYPES.has(word) ? "type" : "plain",
        text,
      ]);
    } else out.push(["plain", text]);

    lastIndex = start + text.length;
  }

  if (lastIndex < code.length) out.push(["plain", code.slice(lastIndex)]);
  return out;
};

/**
 * HTML for the highlight layer.
 *
 * A trailing newline gets a space after it so the layer keeps the same height
 * as the textarea — otherwise the last empty line collapses and everything
 * drifts out of alignment as the student types.
 */
export const highlight = (code: string): string =>
  tokenize(code)
    .map(([kind, text]) =>
      kind === "plain"
        ? escapeHtml(text)
        : `<span class="tok-${kind}">${escapeHtml(text)}</span>`
    )
    .join("") + "\n";
