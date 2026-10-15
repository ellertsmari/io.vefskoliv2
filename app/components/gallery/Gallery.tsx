'use client';

import type { GalleryItem as GalleryItemType } from "app/serverActions/getGallery";
import GalleryItem from "./GalleryItem";
import {
  GalleryGrid,
  GalleryEmpty,
  GallerySearch,
  SearchWrapper,
  FilterControls,
  FilterSelect,
  GallerySort,
} from "./styles";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { sortGalleryItems, type GallerySortOrder } from "./sortGalleryItems";

interface GalleryProps {
  items: GalleryItemType[];
  showControls?: boolean;
}

type CategoryFilter = "all" | "design" | "web" | "other";

const getCategory = (item: GalleryItemType): CategoryFilter => {
  const url = item.returnUrl?.toLocaleLowerCase();

  if (!url) {
    return "other";
  }

  if (url.includes("figma.com/file") || url.includes("figma.com/design") || url.includes("figma.com/proto")) {
    return "design";
  }

  const nonWebsitePatterns = [
    "github.com",
    "gitlab.com",
    "bitbucket.org",
    "figma.com",
    "docs.google.com",
    "drive.google.com",
  ];

  if (!nonWebsitePatterns.some((pattern) => url.includes(pattern))) {
    return "web";
  }

  return "other";
};

const Gallery = ({ items, showControls = false }: GalleryProps) => {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<GallerySortOrder>("recommended");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedYear, setSelectedYear] = useState("all");

  if (!items || items.length === 0) {
    return (
      <GalleryEmpty>
        <h3>Gallery Coming Soon</h3>
        <p>Featured student projects will be displayed here once they are recommended by peers.</p>
      </GalleryEmpty>
    );
  }

  const moduleOptions = [...new Map(items.map((item) => [item.module.number, item.module.title])).entries()]
    .sort((a, b) => a[0] - b[0]);

  const yearOptions = [...new Set(items.map((item) => new Date(item.createdAt).getFullYear()))]
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => b - a);

  const search = query.trim().toLocaleLowerCase();
  const filteredItems = showControls
    ? items.filter((item) => {
        const matchesSearch =
          item.title.toLocaleLowerCase().includes(search) ||
          item.studentName.toLocaleLowerCase().includes(search) ||
          item.module.title.toLocaleLowerCase().includes(search);

        const matchesModule =
          selectedModule === "all" ||
          item.module.number === Number(selectedModule);

        const matchesCategory =
          selectedCategory === "all" ||
          getCategory(item) === selectedCategory;

        const itemYear = new Date(item.createdAt).getFullYear();
        const matchesYear =
          selectedYear === "all" ||
          itemYear === Number(selectedYear);

        return matchesSearch && matchesModule && matchesCategory && matchesYear;
      })
    : items;

  return (
    <>
      {showControls && (
        <>
        <SearchWrapper>
          <FiSearch size={18} aria-hidden="true" />
          <GallerySearch
            type="search"
            placeholder="Search by project, student or module"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </SearchWrapper>

        <FilterControls>
          <FilterSelect
            aria-label="Filter by module"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
          >
            <option value="all">All modules</option>
            {moduleOptions.map(([moduleNumber, moduleTitle]) => (
              <option key={moduleNumber} value={moduleNumber}>
                Module {moduleNumber}: {moduleTitle}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as CategoryFilter)}
          >
            <option value="all">All categories</option>
            <option value="design">Design</option>
            <option value="web">Web</option>
            <option value="other">Other</option>
          </FilterSelect>

          <FilterSelect
            aria-label="Filter by year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">All years</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </FilterSelect>
          <GallerySort>
            <label htmlFor="gallery-sort">Sort by</label>
            <FilterSelect
              id="gallery-sort"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as GallerySortOrder)}
            >
              <option value="recommended">Most recommended</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </FilterSelect>
          </GallerySort>
        </FilterControls>
        </>
      )}

      {filteredItems.length === 0 ? (
        <GalleryEmpty>
          <p>No projects match your current filters.</p>
        </GalleryEmpty>
      ) : (
        <GalleryGrid>
          {sortGalleryItems(filteredItems, sortOrder).map((item) => (
            <GalleryItem key={item.returnId} item={item} />
          ))}
        </GalleryGrid>
      )}
    </>
  );
};

export default Gallery;

