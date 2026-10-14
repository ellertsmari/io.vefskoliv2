import { fireEvent, render, screen } from "@testing-library/react";
import Gallery from "../app/components/gallery/Gallery";
import type { GalleryItem } from "../app/serverActions/getGallery";

jest.mock("../app/components/gallery/GalleryItem", () => ({
  __esModule: true,
  default: ({ item }: { item: GalleryItem }) => <div data-testid="project">{item.title}</div>,
}));
const items: GalleryItem[] = [
  { returnId: "a", title: "Design old", studentName: "Raheel", description: "", module: { title: "Design", number: 1 }, guideTitle: "", recommendationCount: 10, createdAt: "2025-01-01", returnImage: null, returnGif: null, returnUrl: null, projectUrl: null, liveVersion: null, topics: [] },
  { returnId: "b", title: "Design new", studentName: "Julia", description: "", module: { title: "Design", number: 1 }, guideTitle: "", recommendationCount: 1, createdAt: "2026-01-01", returnImage: null, returnGif: null, returnUrl: null, projectUrl: null, liveVersion: null, topics: [] },
];
test("sort selection updates cards and continues to work with search", () => {
  render(<Gallery showControls items={items} />);
  const titles = () => screen.getAllByTestId("project").map(node => node.textContent);
  expect(titles()).toEqual(["Design old", "Design new"]);
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "newest" } });
  expect(titles()).toEqual(["Design new", "Design old"]);
  const search = screen.getByPlaceholderText("Search by project, student or module");
  fireEvent.change(search, { target: { value: "Raheel" } });
  expect(titles()).toEqual(["Design old"]);
  fireEvent.change(search, { target: { value: "" } });
  expect(titles()).toEqual(["Design new", "Design old"]);
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "oldest" } });
  expect(titles()).toEqual(["Design old", "Design new"]);
});

test("sorting preserves combined module, category and year filters", () => {
  const projects = [
    { ...items[0], returnUrl: "https://example.com/old" },
    { ...items[1], returnUrl: "https://example.com/new" },
    { ...items[1], returnId: "c", title: "Another module", module: { title: "Code", number: 2 }, returnUrl: "https://example.com/code" },
    { ...items[1], returnId: "d", title: "Figma design", returnUrl: "https://figma.com/design/demo" },
  ];
  render(<Gallery showControls items={projects} />);
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "newest" } });
  fireEvent.change(screen.getByLabelText("Filter by module"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Filter by category"), { target: { value: "web" } });
  fireEvent.change(screen.getByLabelText("Filter by year"), { target: { value: "2026" } });
  expect(screen.getAllByTestId("project").map(node => node.textContent)).toEqual(["Design new"]);
  fireEvent.change(screen.getByLabelText("Filter by year"), { target: { value: "all" } });
  expect(screen.getAllByTestId("project").map(node => node.textContent)).toEqual(["Design new", "Design old"]);
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "oldest" } });
  expect(screen.getAllByTestId("project").map(node => node.textContent)).toEqual(["Design old", "Design new"]);
});

test("Reset restores search, every filter and recommendation sorting", () => {
  render(<Gallery showControls items={items} />);
  fireEvent.change(screen.getByPlaceholderText("Search by project, student or module"), { target: { value: "Julia" } });
  fireEvent.change(screen.getByLabelText("Filter by module"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Filter by category"), { target: { value: "other" } });
  fireEvent.change(screen.getByLabelText("Filter by year"), { target: { value: "2026" } });
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "newest" } });
  fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
  expect(screen.getByPlaceholderText("Search by project, student or module")).toHaveValue("");
  expect(screen.getByLabelText("Filter by module")).toHaveValue("all");
  expect(screen.getByLabelText("Filter by category")).toHaveValue("all");
  expect(screen.getByLabelText("Filter by year")).toHaveValue("all");
  expect(screen.getByLabelText("Sort by")).toHaveValue("recommended");
  expect(screen.getAllByTestId("project").map(node => node.textContent)).toEqual(["Design old", "Design new"]);
});

test("Reset explanation closes with X and is remembered separately for each user", () => {
  localStorage.clear();
  const view = render(<Gallery showControls items={items} userId="first-user" />);
  expect(screen.getByRole("note", { name: "How Clear all works" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close Clear all explanation" }));
  expect(screen.queryByRole("note")).not.toBeInTheDocument();
  view.unmount();
  const secondView = render(<Gallery showControls items={items} userId="first-user" />);
  expect(screen.queryByRole("note")).not.toBeInTheDocument();
  secondView.unmount();
  render(<Gallery showControls items={items} userId="second-user" />);
  expect(screen.getByRole("note", { name: "How Clear all works" })).toBeInTheDocument();
  localStorage.clear();
});
