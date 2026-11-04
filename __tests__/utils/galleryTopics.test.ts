/**
 * @jest-environment node
 */
import { parseTopics } from "../../app/utils/galleryTopics";

describe("parseTopics", () => {
  it("reads Markdown lists, headings and links as before", () => {
    expect(parseTopics("## Box model\n- Flexbox\n* [Grid](https://x.y)\n1. `Position`")).toEqual([
      "Box model",
      "Flexbox",
      "Grid",
      "Position",
    ]);
  });

  it("strips HTML lists instead of showing the tags", () => {
    expect(
      parseTopics("<p>Things to Google:</p>\n<ul>\n<li>Figma beginners guide</li>\n<li>Smart Animate</li>\n</ul>")
    ).toEqual(["Figma beginners guide", "Smart Animate"]);
  });

  it("handles nested lists written on one line", () => {
    expect(
      parseTopics("<ul><li>Common tags<ul><li>Block elements<ul><li>div, main</li></ul></li></ul></li></ul>")
    ).toEqual(["Common tags", "Block elements", "div", "main"]);
  });

  it("keeps entities and parentheses whole", () => {
    expect(
      parseTopics("<li>Structure &amp; Syntax</li><li>Layout (header, main, footer)</li>")
    ).toEqual(["Structure & Syntax", "Layout (header, main, footer)"]);
  });

  it("returns nothing for an empty list", () => {
    expect(parseTopics(undefined)).toEqual([]);
    expect(parseTopics("<ul></ul>")).toEqual([]);
  });
});
