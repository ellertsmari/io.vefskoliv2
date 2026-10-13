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
  render(<Gallery items={items} />);
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
  render(<Gallery items={projects} />);
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
