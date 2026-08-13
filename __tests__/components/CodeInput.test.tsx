import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { CodeInput } from "../../app/guides/components/exercise/CodeInput";
import { highlight, tokenize } from "../../app/guides/components/exercise/highlight";

describe("highlight", () => {
  const kindsOf = (code: string) =>
    tokenize(code)
      .filter(([, text]) => text.trim())
      .map(([kind, text]) => `${kind}:${text.trim()}`);

  it("marks keywords and types", () => {
    expect(kindsOf("const n: number = 1;")).toEqual(
      expect.arrayContaining(["keyword:const", "type:number", "number:1"])
    );
  });

  it("does not read a keyword inside a string as a keyword", () => {
    const kinds = kindsOf('const s = "return if for";');
    expect(kinds).toContain('string:"return if for"');
    expect(kinds).not.toContain("keyword:return");
  });

  it("does not read // inside a string as a comment", () => {
    expect(kindsOf('const url = "https://x.test";')).toContain(
      'string:"https://x.test"'
    );
  });

  it("marks a comment, keywords inside it included", () => {
    const kinds = kindsOf("// return the const\nlet x = 1;");
    expect(kinds).toContain("comment:// return the const");
    expect(kinds).toContain("keyword:let");
  });

  it("handles template literals", () => {
    expect(kindsOf("const s = `hi ${name}`;")).toContain(
      "template:`hi ${name}`"
    );
  });

  it("escapes HTML so code can never inject markup", () => {
    const html = highlight('const bad = "<img src=x onerror=alert(1)>";');
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("survives unterminated strings and comments while typing", () => {
    expect(() => highlight('const s = "half typed')).not.toThrow();
    expect(() => highlight("/* not closed yet")).not.toThrow();
    expect(() => highlight("const s = `open")).not.toThrow();
  });

  it("keeps every character, so the layer lines up with the text", () => {
    const code = 'function f(n: number) {\n  return `x${n}`; // note\n}\n';
    const joined = tokenize(code)
      .map(([, text]) => text)
      .join("");
    expect(joined).toBe(code);
  });
});

/** A harness so typing updates the value the way the real page does. */
const Editable = ({ initial = "" }: { initial?: string }) => {
  const [value, setValue] = useState(initial);
  return <CodeInput value={value} onChange={setValue} ariaLabel="Your code" />;
};

describe("CodeInput", () => {
  const area = () => screen.getByLabelText("Your code") as HTMLTextAreaElement;

  const typeKey = (key: string, shiftKey = false) =>
    fireEvent.keyDown(area(), { key, shiftKey });

  it("indents with Tab instead of leaving the box", () => {
    render(<Editable />);
    const el = area();
    el.focus();
    const before = document.activeElement;
    typeKey("Tab");
    // Focus stays put — Tab is for indenting here, not navigating away.
    expect(document.activeElement).toBe(before);
  });

  it("auto-indents a new line to match the one above", () => {
    render(<Editable initial={"function f() {\n    let x = 1;"} />);
    const el = area();
    el.setSelectionRange(el.value.length, el.value.length);
    typeKey("Enter");
    // jsdom has no execCommand, so the fallback path runs — which is the one
    // that must also produce the right indentation.
    expect(el.value.endsWith("\n    ")).toBe(true);
  });

  it("adds a level after an opening brace", () => {
    render(<Editable initial={"function f() {"} />);
    const el = area();
    el.setSelectionRange(el.value.length, el.value.length);
    typeKey("Enter");
    expect(el.value).toBe("function f() {\n  ");
  });

  it("renders the highlight layer hidden from screen readers", () => {
    const { container } = render(<Editable initial="const x = 1;" />);
    const layer = container.querySelector("pre");
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer?.textContent).toContain("const x = 1;");
  });
});
