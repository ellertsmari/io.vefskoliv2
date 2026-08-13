import { styleNotes } from "utils/codeStyle";

describe("styleNotes", () => {
  it("says nothing about well-formatted code", () => {
    expect(
      styleNotes("function f() {\n  if (true) {\n    return 1;\n  }\n}")
    ).toEqual([]);
  });

  it("flags tabs mixed with spaces", () => {
    const notes = styleNotes("function f() {\n \treturn 1;\n}");
    expect(notes.join(" ")).toMatch(/mix.*tabs and spaces/i);
  });

  it("leaves code indented entirely with tabs alone", () => {
    // A choice, not a mistake — and not what this is for.
    expect(styleNotes("function f() {\n\treturn 1;\n}")).toEqual([]);
  });

  it("flags an odd number of spaces", () => {
    expect(styleNotes("function f() {\n   return 1;\n}").join(" ")).toMatch(
      /odd number of spaces/i
    );
  });

  it("does not flag a line aligned under an open bracket", () => {
    // Legitimate alignment: the previous line ends mid-expression.
    expect(
      styleNotes("const x = compute(a,\n                  b);")
    ).toEqual([]);
  });

  it("ignores blank lines and unindented code", () => {
    expect(styleNotes("const a = 1;\n\nconst b = 2;\n")).toEqual([]);
  });
});
