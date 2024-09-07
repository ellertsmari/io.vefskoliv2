import { Guides, exportedForTesting } from "../../app/guides/Guides";
import { GuideType } from "../../app/models/guide";
import { fireEvent, render } from "@testing-library/react";

const { fetchModules, filterGuides, createOptions } = exportedForTesting;

type Guides = (GuideType & { individualGuideLink: string })[];

describe("Guides", () => {
  test("renders", async () => {
    const fetchedGuides = [
      { module: { title: "1 Module" }, individualGuideLink: "link1" },
      { module: { title: "2 Module" }, individualGuideLink: "link2" },
    ] as Guides;

    render(<Guides fetchedGuides={fetchedGuides} />);
  });
});

describe("fetchModules", () => {
  it("should return the correct modules", () => {
    const fetchedGuides = [
      { module: { title: "1 Module" }, individualGuideLink: "link1" },
      { module: { title: "2 Module" }, individualGuideLink: "link2" },
      { module: { title: "1 Module" }, individualGuideLink: "link3" },
    ] as Guides;

    const result = fetchModules(fetchedGuides);

    expect(result).toEqual([
      { title: "1 Module", number: 1 },
      { title: "2 Module", number: 2 },
    ]);
  });

  it("should return an empty array when no guides are provided", () => {
    const fetchedGuides = [] as Guides;

    const result = fetchModules(fetchedGuides);

    expect(result).toEqual([]);
  });

  it("should handle guides with non-numeric module titles", () => {
    const fetchedGuides = [
      { module: { title: "Module A" }, individualGuideLink: "link1" },
      { module: { title: "Module B" }, individualGuideLink: "link2" },
    ] as Guides;

    // Act
    const result = fetchModules(fetchedGuides);

    expect(result).toEqual([
      { title: "Module A", number: NaN },
      { title: "Module B", number: NaN },
    ]);
  });

  it("should only store first result encountered when 2 modules with the same number but different titles", () => {
    const fetchedGuides = [
      { module: { title: "1 Module A" }, individualGuideLink: "link1" },
      { module: { title: "1 Module B" }, individualGuideLink: "link2" },
    ] as Guides;

    const result = fetchModules(fetchedGuides);

    expect(result).toEqual([{ title: "1 Module A", number: 1 }]);
  });
});

describe("filterGuides", () => {
  it("should return the correct guides", () => {
    const selectedModule = 1;
    const fetchedGuides = [
      { module: { title: "1 Module" }, individualGuideLink: "link1" },
      { module: { title: "2 Module" }, individualGuideLink: "link2" },
      { module: { title: "1 Module" }, individualGuideLink: "link3" },
    ] as Guides;

    const result = filterGuides(selectedModule, fetchedGuides);

    expect(result).toEqual([
      { module: { title: "1 Module" }, individualGuideLink: "link1" },
      { module: { title: "1 Module" }, individualGuideLink: "link3" },
    ]);
  });

  it("should return all guides when selectedModule is undefined", () => {
    const selectedModule = undefined;
    const fetchedGuides = [
      { module: { title: "1 Module" }, individualGuideLink: "link1" },
      { module: { title: "2 Module" }, individualGuideLink: "link2" },
    ] as Guides;

    const result = filterGuides(selectedModule, fetchedGuides);

    expect(result).toEqual(fetchedGuides);
  });

  it("should return an empty array when no guides match the selected module", () => {
    const selectedModule = 3;
    const fetchedGuides = [
      { module: { title: "1 Module" }, individualGuideLink: "link1" },
      { module: { title: "2 Module" }, individualGuideLink: "link2" },
    ] as Guides;

    const result = filterGuides(selectedModule, fetchedGuides);

    expect(result).toEqual([]);
  });

  it("should return an empty array when selectedModule is not a number", () => {
    const selectedModule = "not a number";
    const fetchedGuides = [
      { module: { title: "1 Module" }, individualGuideLink: "link1" },
      { module: { title: "2 Module" }, individualGuideLink: "link2" },
    ] as Guides;

    const result = filterGuides(selectedModule as any, fetchedGuides);

    expect(result).toEqual([]);
  });

  it("should not return a module when the number is not the first character", () => {
    const selectedModule = 2;
    const fetchedGuides = [
      { module: { title: "Module 2" }, individualGuideLink: "link1" },
      { module: { title: "2 Module" }, individualGuideLink: "link2" },
    ] as Guides;

    const result = filterGuides(selectedModule, fetchedGuides);

    expect(result).toEqual([
      { module: { title: "2 Module" }, individualGuideLink: "link2" },
    ]);
  });
});

describe("createOptions", () => {
  it("creates options from modules", () => {
    const setSelectedModule = jest.fn();
    const modules = [
      { title: "1", number: 1 },
      { title: "2", number: 2 },
      { title: "2", number: 3 },
    ];

    const options = createOptions(modules, setSelectedModule);

    expect(options[0].optionName).toEqual("All");
    options[0].onClick();
    expect(setSelectedModule).toHaveBeenCalledWith(undefined);

    for (let i = 0; i < modules.length; i++) {
      expect(options[i + 1].optionName).toEqual("Module " + modules[i].number);
      options[i + 1].onClick();
      expect(setSelectedModule).toHaveBeenCalledWith(modules[i].number);
    }
  });
  it('creates only "All" option when modules array is empty', () => {
    const setSelectedModule = jest.fn();
    const modules = [] as { title: string; number: number }[];

    const options = createOptions(modules, setSelectedModule);

    // Check that the only option is "All"
    expect(options.length).toEqual(1);
    expect(options[0].optionName).toEqual("All");
    options[0].onClick();
    expect(setSelectedModule).toHaveBeenCalledWith(undefined);
  });
});