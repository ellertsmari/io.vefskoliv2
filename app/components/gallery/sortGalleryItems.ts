import type { GalleryItem } from "app/serverActions/getGallery";

export type GallerySortOrder = "recommended" | "newest" | "oldest";

const timestamp = (item: GalleryItem): number | null => {
  const value = item.createdAt ? Date.parse(item.createdAt) : NaN;
  return Number.isFinite(value) ? value : null;
};

export const sortGalleryItems = (items: GalleryItem[], order: GallerySortOrder): GalleryItem[] =>
  [...items].sort((a, b) => {
    if (order === "recommended" && a.recommendationCount !== b.recommendationCount) {
      return b.recommendationCount - a.recommendationCount;
    }
    const first = timestamp(a);
    const second = timestamp(b);
    if (first === null && second !== null) return 1;
    if (first !== null && second === null) return -1;
    if (first !== null && second !== null && first !== second) {
      return order === "oldest" ? first - second : second - first;
    }
    return a.returnId.localeCompare(b.returnId);
  });
