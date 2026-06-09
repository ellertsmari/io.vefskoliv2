import { Guides, exportedForTesting } from "app/guides/components/guides/Guides";
import { ExtendedGuideInfo } from "types/guideTypes";
import { fireEvent, render, waitFor } from "@testing-library/react";
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyExtendedGuides,
  createDummyModules,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { fetchModules } from "utils/guideUtils";

// Mocking custom useStorage hooks as they are not needed for this test
jest.mock("utils/hooks/useStorage", () => ({
  useLocalState: jest.fn(() => [null, jest.fn(), false]),
}));

jest.mock("../../app/guides/components/guidesClient/GuidesClient", () => ({
  GuidesClient: ({ guides }: { guides: ExtendedGuideInfo[] }) =>
    guides.map((guide) => <div key={guide.link}>{guide.module.title}</div>),
}));

const { filterGuides, createOptions, currentOptionName } = exportedForTesting;

describe("Guides", () => {
  beforeAll(async () => await connect());
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => await closeDatabase());

  test("changes guides shown based on dropdown selection", async () => {
    const user = await createDummyUser();
    const extendedGuides = await createDummyExtendedGuides(user, 3);
    const modules = createDummyModules(10);

    const { queryByText, getByText } = render(
      <Guides
        extendedGuides={extendedGuides}
        modules={modules}
      />
    );

    // Initially guides are shown
    await waitFor(() => {
      expect(queryByText(extendedGuides[0].module.title)).toBeDefined();
      expect(queryByText(extendedGuides[1].module.title)).toBeDefined();
      expect(queryByText(extendedGuides[2].module.title)).toBeDefined();
    });

    // Capsules render the modules' real titles, with an "All modules" option first
    expect(getByText("All modules")).toBeDefined();
    const moduleNumber = parseInt(extendedGuides[1].module.title[0]);
    fireEvent.click(getByText(modules[moduleNumber].title));

    // Check that the filtered guide is shown
    await waitFor(() => {
      expect(getByText(extendedGuides[1].module.title)).toBeDefined();
    });
  });

  test("renders correctly when no guides are provided", async () => {
    const guides = [] as ExtendedGuideInfo[];

    const { queryByText, container } = render(
      <Guides extendedGuides={guides} modules={[]} />
    );

    // When no modules are provided, only the "All modules" capsule renders
    await waitFor(() => {
      expect(queryByText(/Module \d/)).toBeNull();
      expect(queryByText("All modules")).toBeDefined();
    });
  });
});

describe("fetchModules", () => {
  it("should return the correct modules", () => {
    const fetchedGuides = [
      { module: { title: "1 Module" }, link: "link1" },
      { module: { title: "2 Module" }, link: "link2" },
      { module: { title: "1 Module" }, link: "link3" },
    ] as ExtendedGuideInfo[];

    const result = fetchModules(fetchedGuides);

    expect(result).toEqual([
      { title: "1 Module", number: 1 },
      { title: "2 Module", number: 2 },
    ]);
  });

  it("should return an empty array when no guides are provided", () => {
    const fetchedGuides = [] as ExtendedGuideInfo[];

    const result = fetchModules(fetchedGuides);

    expect(result).toEqual([]);
  });

  it("should handle guides with non-numeric module titles by defaulting to 0", () => {
    const fetchedGuides = [
      { module: { title: "Module A" }, link: "link1" },
      { module: { title: "Module B" }, link: "link2" },
    ] as ExtendedGuideInfo[];

    // Act
    const result = fetchModules(fetchedGuides);

    // Non-numeric titles default to module number 0, so they get de-duplicated
    expect(result).toEqual([{ title: "Module A", number: 0 }]);
  });

  it("should only store first result encountered when 2 modules with the same number but different titles", () => {
    const fetchedGuides = [
      { module: { title: "1 Module A" }, link: "link1" },
      { module: { title: "1 Module B" }, link: "link2" },
    ] as ExtendedGuideInfo[];

    const result = fetchModules(fetchedGuides);

    expect(result).toEqual([{ title: "1 Module A", number: 1 }]);
  });
});

describe("filterGuides", () => {
  it("should return the correct guides", () => {
    const selectedModule = 1;
    const fetchedGuides = [
      { module: { title: "1 Module" }, link: "link1" },
      { module: { title: "2 Module" }, link: "link2" },
      { module: { title: "1 Module" }, link: "link3" },
    ] as ExtendedGuideInfo[];

    const result = filterGuides(selectedModule, fetchedGuides);

    expect(result).toEqual([
      { module: { title: "1 Module" }, link: "link1" },
      { module: { title: "1 Module" }, link: "link3" },
    ]);
  });

  it("should return all guides when selectedModule is null", () => {
    const selectedModule = null;
    const fetchedGuides = [
      { module: { title: "1 Module" }, link: "link1" },
      { module: { title: "2 Module" }, link: "link2" },
    ] as ExtendedGuideInfo[];

    const result = filterGuides(selectedModule, fetchedGuides);

    expect(result).toEqual(fetchedGuides);
  });

  it("should return an empty array when no guides match the selected module", () => {
    const selectedModule = 3;
    const fetchedGuides = [
      { module: { title: "1 Module" }, link: "link1" },
      { module: { title: "2 Module" }, link: "link2" },
    ] as ExtendedGuideInfo[];

    const result = filterGuides(selectedModule, fetchedGuides);

    expect(result).toEqual([]);
  });

  it("should return an empty array when selectedModule is not a number", () => {
    const selectedModule = "not a number";
    const fetchedGuides = [
      { module: { title: "1 Module" }, link: "link1" },
      { module: { title: "2 Module" }, link: "link2" },
    ] as ExtendedGuideInfo[];

    const result = filterGuides(selectedModule as any, fetchedGuides);

    expect(result).toEqual([]);
  });

  it("should not return a module when the number is not the first character", () => {
    const selectedModule = 2;
    const fetchedGuides = [
      { module: { title: "Module 2" }, link: "link1" },
      { module: { title: "2 Module" }, link: "link2" },
    ] as ExtendedGuideInfo[];

    const result = filterGuides(selectedModule, fetchedGuides);

    expect(result).toEqual([{ module: { title: "2 Module" }, link: "link2" }]);
  });
});

describe("createOptions", () => {
  it("creates an All option followed by one option per module, labeled by title", () => {
    const setSelectedModule = jest.fn();
    const modules = [
      { title: "1 - Fundamentals", number: 1 },
      { title: "2 - Connecting", number: 2 },
    ];

    const options = createOptions(modules, setSelectedModule);

    expect(options[0].optionName).toEqual("All modules");
    options[0].onClick();
    expect(setSelectedModule).toHaveBeenCalledWith(null);

    for (let i = 0; i < modules.length; i++) {
      expect(options[i + 1].optionName).toEqual(modules[i].title);
      options[i + 1].onClick();
      expect(setSelectedModule).toHaveBeenCalledWith(modules[i].number);
    }
  });

  it("falls back to 'Module N' when a module title is missing", () => {
    const setSelectedModule = jest.fn();
    const options = createOptions(
      [{ title: "", number: 4 }],
      setSelectedModule
    );
    expect(options[1].optionName).toEqual("Module 4");
  });

  it("creates only the All option when modules array is empty", () => {
    const setSelectedModule = jest.fn();
    const options = createOptions([], setSelectedModule);

    expect(options.length).toEqual(1);
    expect(options[0].optionName).toEqual("All modules");
  });
});

describe("currentOptionName", () => {
  const modules = [{ title: "3 - The fundamentals", number: 3 }];

  it("returns the module title for a selected module", () => {
    expect(currentOptionName(3, modules)).toEqual("3 - The fundamentals");
  });

  it("returns All modules when nothing is selected", () => {
    expect(currentOptionName(null, modules)).toEqual("All modules");
  });

  it("returns All modules when the selection no longer exists", () => {
    expect(currentOptionName(7, modules)).toEqual("All modules");
  });
});
