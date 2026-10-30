import {
  guidePageTitle,
  isDraftGuide,
  moduleDisplayName,
  plainExcerpt,
} from "utils/guideSeo";

describe("isDraftGuide", () => {
  it("knows a guide that still has the placeholders it was created with", () => {
    expect(isDraftGuide({ title: "Untitled guide", description: "TODO: add a description" })).toBe(true);
    expect(isDraftGuide({ title: "Wireframe", description: "TODO: add a description" })).toBe(true);
    expect(isDraftGuide({ title: "Untitled guide", description: "Real text" })).toBe(true);
    expect(isDraftGuide({ title: "  ", description: "Real text" })).toBe(true);
  });

  it("leaves a written guide alone, even one that mentions a todo app", () => {
    expect(isDraftGuide({ title: "Wireframe", description: "Sketch the screens first." })).toBe(false);
    expect(isDraftGuide({ title: "Todo app", description: "Build a todo list in React." })).toBe(false);
  });
});

describe("plainExcerpt", () => {
  it("turns markdown into one plain line", () => {
    const md = "## Intro\n\nRead the [MDN guide](https://developer.mozilla.org) and **build** a `div`.\n\n![shot](x.png)\n\n```js\nconsole.log(1)\n```\n- one\n- two";
    expect(plainExcerpt(md)).toBe("Intro Read the MDN guide and build a div. one two");
  });

  it("cuts long text at a word and marks the cut", () => {
    const text = "word ".repeat(60);
    const excerpt = plainExcerpt(text, 50);
    expect(excerpt.length).toBeLessThanOrEqual(50);
    expect(excerpt.endsWith("word…")).toBe(true);
  });

  it("is empty for an empty description", () => {
    expect(plainExcerpt("")).toBe("");
  });
});

describe("titles", () => {
  it("name the guide, its module and the school", () => {
    expect(guidePageTitle({ title: "Wireframe", module: { title: "3 - The fundamentals", number: 3 } }))
      .toBe("Wireframe · The fundamentals · Vefskólinn");
  });

  it("fall back to the module number, or leave the module out", () => {
    expect(moduleDisplayName({ title: "4", number: 4 })).toBe("Module 4");
    expect(guidePageTitle({ title: "Wireframe" })).toBe("Wireframe · Vefskólinn");
  });
});
