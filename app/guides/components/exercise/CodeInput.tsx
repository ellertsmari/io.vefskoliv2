"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { highlight } from "./highlight";
import { EditorWrap, EditorHighlight, EditorTextArea } from "./style";

/**
 * The code box for a code task.
 *
 * A textarea cannot show colours, so the highlighted copy sits in a layer
 * behind it and the textarea itself is made transparent. The textarea stays the
 * real control — it keeps focus, selection, screen-reader behaviour and native
 * undo — and the layer is `aria-hidden`, so nothing is announced twice.
 *
 * Both layers must agree on font, size, line height, padding and wrapping to
 * the pixel, or the characters drift apart as the student types. That is why
 * the two styled components share their box rules.
 */

const INDENT = "  ";

/** Insert text via the browser so native undo keeps working. */
const insert = (el: HTMLTextAreaElement, text: string) => {
  el.focus();
  if (!document.execCommand?.("insertText", false, text)) {
    // Fallback for browsers that have dropped execCommand: this loses the
    // undo stack, which is worse but still usable.
    const { selectionStart, selectionEnd, value } = el;
    el.value =
      value.slice(0, selectionStart) + text + value.slice(selectionEnd);
    const at = selectionStart + text.length;
    el.setSelectionRange(at, at);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
};

/** The whitespace at the start of the line the cursor is on. */
const currentIndent = (value: string, caret: number): string => {
  const lineStart = value.lastIndexOf("\n", caret - 1) + 1;
  const line = value.slice(lineStart, caret);
  return /^[ \t]*/.exec(line)?.[0] ?? "";
};

export const CodeInput = ({
  value,
  onChange,
  disabled,
  maxLength,
  rows = 14,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
  ariaLabel: string;
}) => {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Keep the layer lined up when the textarea scrolls.
  const syncScroll = useCallback(() => {
    const area = areaRef.current;
    const pre = preRef.current;
    if (!area || !pre) return;
    pre.scrollTop = area.scrollTop;
    pre.scrollLeft = area.scrollLeft;
  }, []);

  useLayoutEffect(syncScroll, [value, syncScroll]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const area = areaRef.current;
    if (!area) return;
    const { selectionStart, selectionEnd, value: text } = area;

    // Tab indents rather than leaving the box. The box is the only thing on
    // screen a student wants Tab for, and losing their place mid-problem is
    // worse than the usual argument for keeping Tab as navigation — Escape
    // then Tab still gets them out.
    if (event.key === "Tab") {
      event.preventDefault();
      const multiLine = text.slice(selectionStart, selectionEnd).includes("\n");

      if (!multiLine && !event.shiftKey) {
        insert(area, INDENT);
        return;
      }

      // Indent or outdent every line the selection touches.
      const from = text.lastIndexOf("\n", selectionStart - 1) + 1;
      const to = text.indexOf("\n", selectionEnd);
      const end = to === -1 ? text.length : to;
      const block = text.slice(from, end);
      const changed = block
        .split("\n")
        .map((line) =>
          event.shiftKey
            ? line.replace(/^ {1,2}|^\t/, "")
            : line.length > 0
            ? INDENT + line
            : line
        )
        .join("\n");

      area.setSelectionRange(from, end);
      insert(area, changed);
      area.setSelectionRange(from, from + changed.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const indent = currentIndent(text, selectionStart);
      const before = text.slice(0, selectionStart).trimEnd();
      const opensBlock = /[{([]$/.test(before);
      const closesNext = /^[\s]*[})\]]/.test(text.slice(selectionEnd));

      if (opensBlock && closesNext) {
        // Typing Enter between { and } puts the closing brace on its own line
        // and leaves the cursor in the middle, which is where the code goes.
        insert(area, `\n${indent}${INDENT}\n${indent}`);
        const caret = area.selectionStart - indent.length - 1;
        area.setSelectionRange(caret, caret);
        return;
      }
      insert(area, `\n${indent}${opensBlock ? INDENT : ""}`);
      return;
    }
  };

  return (
    <EditorWrap>
      <EditorHighlight
        ref={preRef}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: highlight(value) }}
      />
      <EditorTextArea
        ref={areaRef}
        value={value}
        rows={rows}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        disabled={disabled}
        maxLength={maxLength}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
      />
    </EditorWrap>
  );
};
