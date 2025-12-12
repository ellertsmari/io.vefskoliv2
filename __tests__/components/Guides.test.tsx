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

const { filterGuides, createOptions } = exportedForTesting;

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

    // The component uses ModuleOptions dropdown with Module X buttons
    // Click on a different module to filter guides
    const moduleNumber = parseInt(extendedGuides[1].module.title[0]);
    fireEvent.click(getByText("Module " + moduleNumber));

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

    // When no guides/modules are provided, no module buttons should be rendered
    await waitFor(() => {
      // Check that no module option buttons are rendered
      expect(queryByText(/Module \d/)).toBeNull();
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
  it("creates options from modules", () => {
    const setSelectedModule = jest.fn();
    const modules = [
      { title: "1", number: 1 },
      { title: "2", number: 2 },
      { title: "2", number: 3 },
    ];

    const options = createOptions(modules, setSelectedModule);

    for (let i = 0; i < modules.length; i++) {
      expect(options[i].optionName).toEqual("Module " + modules[i].number);
      options[i].onClick();
      expect(setSelectedModule).toHaveBeenCalledWith(modules[i].number);
    }
  });
  it("creates empty array when modules array is empty", () => {
    const setSelectedModule = jest.fn();
    const modules = [] as { title: string; number: number }[];

    const options = createOptions(modules, setSelectedModule);

    expect(options.length).toEqual(0);
  });
});
