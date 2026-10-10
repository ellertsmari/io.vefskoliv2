import { sortGalleryItems } from "../app/components/gallery/sortGalleryItems";
import type { GalleryItem } from "../app/serverActions/getGallery";

const item = (returnId: string, recommendationCount: number, createdAt?: string): GalleryItem => ({
  returnId, recommendationCount, createdAt: createdAt ?? "", title: returnId, description: "",
  studentName: "Raheel", module: { title: "Design", number: 1 },
  guideTitle: "", returnImage: null, returnGif: null, returnUrl: null,
});
const ids = (items: GalleryItem[]) => items.map(value => value.returnId);

test("recommendations sort descending with newer projects breaking ties", () => {
  const items = [item("a", 2, "2026-01-01"), item("b", 5, "2025-01-01"), item("c", 2, "2026-02-01")];
  expect(ids(sortGalleryItems(items, "recommended"))).toEqual(["b", "c", "a"]);
  expect(ids(items)).toEqual(["a", "b", "c"]);
});
test("date sorting ignores votes and places missing or invalid dates last", () => {
  const items = [item("a", 20, "2025-01-01"), item("b", 1, "2026-01-01"), item("c", 50), item("d", 30, "invalid")];
  expect(ids(sortGalleryItems(items, "newest"))).toEqual(["b", "a", "c", "d"]);
  expect(ids(sortGalleryItems(items, "oldest"))).toEqual(["a", "b", "c", "d"]);
});
test("equal values have deterministic ordering and empty lists are supported", () => {
  expect(ids(sortGalleryItems([item("b", 1), item("a", 1)], "recommended"))).toEqual(["a", "b"]);
  expect(sortGalleryItems([], "newest")).toEqual([]);
});
