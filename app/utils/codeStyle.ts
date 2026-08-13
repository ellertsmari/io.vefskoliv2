/**
 * Formatting nudges for a code submission.
 *
 * These NEVER affect the score. Working code that is badly laid out is still
 * working code, and failing it for whitespace teaches a student that the
 * grader cares more about appearance than about whether the thing runs. But
 * saying nothing teaches nothing either, so it is said and not counted.
 *
 * Deliberately narrow. A style check that fires on reasonable code trains
 * people to ignore it, so this only reports things that are unambiguous:
 * tabs mixed with spaces, and indentation that is not a whole number of steps.
 * Alignment continuations — a wrapped argument list lined up under an opening
 * bracket — are exempt for exactly that reason.
 */

const INDENT_WIDTH = 2;

/** Leading whitespace, or null for a blank line. */
const leadingSpace = (line: string): string | null =>
  line.trim() === "" ? null : (/^[ \t]*/.exec(line)?.[0] ?? "");

/**
 * A line that continues the previous one — the previous line ends on an open
 * bracket or a comma — may be aligned to anything the author likes.
 */
const isContinuation = (previous: string | undefined): boolean =>
  // Note the absence of `{`: a line after an opening brace is ordinary
  // nesting, and its indentation should be a proper number of steps. Including
  // it exempted the single most common case there is.
  !!previous && /[([,+\-*/=&|?:]$/.test(previous.trim());

export const styleNotes = (source: string): string[] => {
  const lines = (source ?? "").split("\n");
  const notes: string[] = [];

  const mixed: number[] = [];
  const odd: number[] = [];

  lines.forEach((line, i) => {
    const indent = leadingSpace(line);
    if (indent === null || indent === "") return;

    if (indent.includes("\t") && indent.includes(" ")) {
      mixed.push(i + 1);
      return;
    }
    if (indent.includes("\t")) return; // tabs throughout is a choice, not a bug

    if (indent.length % INDENT_WIDTH !== 0 && !isContinuation(lines[i - 1])) {
      odd.push(i + 1);
    }
  });

  if (mixed.length > 0) {
    notes.push(
      `Line${mixed.length > 1 ? "s" : ""} ${mixed.join(", ")} mix${
        mixed.length > 1 ? "" : "es"
      } tabs and spaces for indentation. They look identical and line up ` +
        `differently in different editors, which is why picking one matters.`
    );
  }

  if (odd.length > 0) {
    notes.push(
      `Line${odd.length > 1 ? "s" : ""} ${odd.join(", ")} ${
        odd.length > 1 ? "are" : "is"
      } indented by an odd number of spaces. Each level of nesting is two ` +
        `spaces here — pressing Tab in the editor gets it right for you.`
    );
  }

  return notes;
};
