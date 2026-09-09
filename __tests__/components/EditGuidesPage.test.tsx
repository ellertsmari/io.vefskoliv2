/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { EditGuidesPage, FILTERS_STORAGE_KEY } from "app/components/editGuides/EditGuidesPage";
import type { EditorGuideRow } from "serverActions/editGuideActions";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));
jest.mock("serverActions/editGuideActions", () => ({
  deleteGuide: jest.fn(),
}));

const row = (overrides: Partial<EditorGuideRow>): EditorGuideRow => ({
  id: "1",
  title: "Guide",
  description: "",
  moduleTitle: "1 - Introductory Course",
  moduleNumber: 1,
  order: 1,
  discipline: "code",
  isSpecialty: false,
  gradingMode: "peerReview",
  updatedAt: "2026-08-12T10:00:00.000Z",
  ...overrides,
});

const guides = [
  row({ id: "a", title: "HTML & CSS - Introduction", moduleNumber: 1 }),
  row({ id: "b", title: "Figma - Wireframes", discipline: "design", moduleNumber: 1 }),
  row({ id: "c", title: "React - Components", moduleTitle: "4 - Front-end", moduleNumber: 4 }),
];

describe("EditGuidesPage filters", () => {
  afterEach(() => window.localStorage.clear());

  it("remembers the search and filters between visits", async () => {
    const { unmount } = render(<EditGuidesPage guides={guides} />);
    fireEvent.change(await screen.findByLabelText("Filter by discipline"), {
      target: { value: "code" },
    });
    fireEvent.change(screen.getByLabelText("Filter by module"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Search guides"), { target: { value: "html" } });
    expect(screen.getByText("HTML & CSS - Introduction")).toBeInTheDocument();
    expect(screen.queryByText("Figma - Wireframes")).not.toBeInTheDocument();
    expect(screen.queryByText("React - Components")).not.toBeInTheDocument();
    unmount();

    // Back from editing a guide: the same list, not everything again.
    render(<EditGuidesPage guides={guides} />);
    expect(await screen.findByText("HTML & CSS - Introduction")).toBeInTheDocument();
    expect(screen.queryByText("React - Components")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Search guides")).toHaveValue("html");
    expect(screen.getByLabelText("Filter by module")).toHaveValue("1");
    expect(JSON.parse(window.localStorage.getItem(FILTERS_STORAGE_KEY) ?? "{}")).toEqual({
      search: "html",
      discipline: "code",
      module: "1",
    });
  });

  it("offers a way out of an empty, remembered filter", async () => {
    window.localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({ search: "nothing matches this", discipline: "all", module: "all" })
    );
    render(<EditGuidesPage guides={guides} />);
    fireEvent.click(await screen.findByRole("button", { name: "Clear the search and filters" }));
    expect(screen.getByText("React - Components")).toBeInTheDocument();
    expect(screen.getByLabelText("Search guides")).toHaveValue("");
  });
});
