import { linkWarning, returnFieldsFor } from "utils/returnFields";

describe("returnFieldsFor", () => {
  it("names the fields by discipline, falling back through category", () => {
    expect(returnFieldsFor({ discipline: "design" }).projectUrl.label).toBe("Figma file");
    expect(returnFieldsFor({ category: "codeSpeciality" }).liveVersion.label).toBe("Live page");
    expect(returnFieldsFor({}).projectUrl.label).toBe("GitHub repository");
  });
});

describe("linkWarning", () => {
  it("says nothing about an empty or unreadable value", () => {
    expect(linkWarning("code", "projectUrl", "")).toBeUndefined();
    expect(linkWarning("code", "projectUrl", "not a url at all :: ")).toBeUndefined();
  });

  it("accepts the expected links, with or without a scheme", () => {
    expect(linkWarning("code", "projectUrl", "github.com/anna/site")).toBeUndefined();
    expect(linkWarning("code", "liveVersion", "https://anna.github.io/site")).toBeUndefined();
    expect(linkWarning("code", "liveVersion", "https://my-site.is")).toBeUndefined();
    expect(linkWarning("design", "projectUrl", "https://www.figma.com/design/abc/Site")).toBeUndefined();
    expect(linkWarning("design", "liveVersion", "https://www.figma.com/proto/abc/Site")).toBeUndefined();
  });

  it("spots the common mix-ups", () => {
    expect(linkWarning("code", "projectUrl", "https://www.figma.com/design/abc")).toMatch(/Figma/);
    expect(linkWarning("code", "projectUrl", "https://gitlab.com/anna/site")).toMatch(/GitHub/);
    expect(linkWarning("code", "liveVersion", "https://github.com/anna/site")).toMatch(/repository/);
    expect(linkWarning("design", "projectUrl", "https://github.com/anna/site")).toMatch(/Figma/);
    expect(linkWarning("design", "projectUrl", "https://www.figma.com/proto/abc")).toMatch(/prototype link/);
    expect(linkWarning("design", "liveVersion", "https://www.figma.com/design/abc")).toMatch(/file link/);
  });
});
