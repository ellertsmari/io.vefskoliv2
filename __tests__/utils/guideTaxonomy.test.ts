import {
  categoryToAxes,
  axesToCategory,
  getDiscipline,
  getIsSpecialty,
  isCodeCategory,
} from "utils/guideTaxonomy";

describe("categoryToAxes", () => {
  it("maps every legacy category to the right axes", () => {
    expect(categoryToAxes("code")).toEqual({ discipline: "code", isSpecialty: false });
    expect(categoryToAxes("design")).toEqual({ discipline: "design", isSpecialty: false });
    expect(categoryToAxes("codeSpeciality")).toEqual({ discipline: "code", isSpecialty: true });
    expect(categoryToAxes("designSpeciality")).toEqual({ discipline: "design", isSpecialty: true });
  });

  it("falls back to code/non-specialty for unknown or empty values", () => {
    expect(categoryToAxes(undefined)).toEqual({ discipline: "code", isSpecialty: false });
    expect(categoryToAxes("")).toEqual({ discipline: "code", isSpecialty: false });
    expect(categoryToAxes("nonsense")).toEqual({ discipline: "code", isSpecialty: false });
  });
});

describe("axesToCategory", () => {
  it("round-trips with categoryToAxes for all four combinations", () => {
    for (const category of ["code", "design", "codeSpeciality", "designSpeciality"]) {
      const axes = categoryToAxes(category);
      expect(axesToCategory(axes.discipline, axes.isSpecialty)).toBe(category);
    }
  });
});

describe("getDiscipline / getIsSpecialty", () => {
  it("prefers the canonical fields when present", () => {
    const guide = { discipline: "design", isSpecialty: true, category: "code" };
    expect(getDiscipline(guide)).toBe("design");
    expect(getIsSpecialty(guide)).toBe(true);
  });

  it("falls back to deriving from category when the fields are absent", () => {
    const guide = { category: "designSpeciality" };
    expect(getDiscipline(guide)).toBe("design");
    expect(getIsSpecialty(guide)).toBe(true);
  });

  it("treats an invalid discipline field as absent and derives instead", () => {
    const guide = { discipline: "garbage", category: "design" };
    expect(getDiscipline(guide)).toBe("design");
  });
});

describe("isCodeCategory (regression for the 'speciality code' bug)", () => {
  it("treats both code and codeSpeciality as code", () => {
    expect(isCodeCategory("code")).toBe(true);
    expect(isCodeCategory("codeSpeciality")).toBe(true);
  });

  it("treats design and designSpeciality as not code", () => {
    expect(isCodeCategory("design")).toBe(false);
    expect(isCodeCategory("designSpeciality")).toBe(false);
  });
});
