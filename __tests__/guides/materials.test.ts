/**
 * @jest-environment node
 */
import {
  collectMaterials,
} from "../../app/guides/components/guideOverview/materials";

const FCC =
  "https://www.freecodecamp.org/learn/responsive-web-design/basic-html-and-html5/";

describe("collectMaterials", () => {
  it("gathers all three sources, in reading order", () => {
    const materials = collectMaterials({
      resources: [{ description: "A resource", link: "https://a.example" }],
      classes: [{ title: "A class", link: "https://b.example" }],
      references: [{ name: "A reference", link: "https://c.example" }],
    });

    expect(materials.map((material) => material.title)).toEqual([
      "A resource",
      "A class",
      "A reference",
    ]);
  });

  it("normalises each source's own name for the title field", () => {
    const materials = collectMaterials({
      resources: [{ description: "From description", link: "https://a.example" }],
      references: [{ name: "From name", link: "https://c.example" }],
    });

    expect(materials).toEqual([
      { title: "From description", link: "https://a.example" },
      { title: "From name", link: "https://c.example" },
    ]);
  });

  it("lists a link once even when two sources carry it", () => {
    // The real case behind React's "two children with the same key" warning:
    // the same freeCodeCamp page was both a class material and a resource.
    const materials = collectMaterials({
      resources: [{ description: "Basic HTML", link: FCC }],
      classes: [{ title: "Basic HTML and HTML5", link: FCC }],
    });

    expect(materials).toHaveLength(1);
    expect(materials[0].link).toBe(FCC);
  });

  it("keeps the first title when a link is duplicated", () => {
    const materials = collectMaterials({
      resources: [{ description: "First", link: FCC }],
      classes: [{ title: "Second", link: FCC }],
    });

    expect(materials[0].title).toBe("First");
  });

  it("produces links unique enough to use as React keys", () => {
    const materials = collectMaterials({
      resources: [
        { description: "One", link: FCC },
        { description: "Two", link: FCC },
      ],
      classes: [
        { title: "Three", link: FCC },
        { title: "Four", link: "https://other.example" },
      ],
      references: [{ name: "Five", link: "https://other.example" }],
    });

    const links = materials.map((material) => material.link);
    expect(new Set(links).size).toBe(links.length);
  });

  it("treats links that differ only by surrounding whitespace as the same", () => {
    const materials = collectMaterials({
      resources: [{ description: "Padded", link: `  ${FCC}  ` }],
      classes: [{ title: "Clean", link: FCC }],
    });

    expect(materials).toHaveLength(1);
    expect(materials[0].link).toBe(FCC);
  });

  it("drops entries with no title, since they can't be rendered", () => {
    const materials = collectMaterials({
      resources: [
        { description: "", link: "https://a.example" },
        { description: "   ", link: "https://b.example" },
        { description: "Keep me", link: "https://c.example" },
      ],
    });

    expect(materials.map((material) => material.title)).toEqual(["Keep me"]);
  });

  it("drops entries with no link, since they have nowhere to go", () => {
    const materials = collectMaterials({
      classes: [
        { title: "No link", link: "" },
        { title: "Has link", link: "https://a.example" },
      ],
    });

    expect(materials.map((material) => material.title)).toEqual(["Has link"]);
  });

  it("trims the titles it keeps", () => {
    const materials = collectMaterials({
      resources: [{ description: "  Spaced out  ", link: "https://a.example" }],
    });

    expect(materials[0].title).toBe("Spaced out");
  });

  it("copes with missing, empty and null sources", () => {
    expect(collectMaterials({})).toEqual([]);
    expect(collectMaterials({ resources: [], classes: [], references: [] })).toEqual(
      []
    );
    expect(
      collectMaterials({ resources: null, classes: null, references: null })
    ).toEqual([]);
    expect(collectMaterials({ resources: [null] })).toEqual([]);
    expect(collectMaterials({ classes: [{ title: null, link: null }] })).toEqual(
      []
    );
  });
});
