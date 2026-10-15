'use client';
import { AppliedGalleryLayout } from "./AppliedGalleryLayout";
import GalleryDevTools from "./GalleryDevTools";

import type { GalleryItem as GalleryItemType } from "app/serverActions/getGallery";
import GalleryItem from "./GalleryItem";
import GalleryMultiFilter from "./GalleryMultiFilter";
import ResetIntroduction from "./ResetIntroduction";
import {
  GalleryGrid,
  GalleryEmpty,
  GallerySearch,
  SearchWrapper,
  FilterControls,
  FilterSelect,
  GallerySort,
  GalleryReset,
} from "./styles";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { sortGalleryItems, type GallerySortOrder } from "./sortGalleryItems";

interface GalleryProps {
  items: GalleryItemType[];
  showControls?: boolean;
  userId?: string;
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

const Gallery = ({ items, userId, showControls = false }: GalleryProps) => {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<GallerySortOrder>("recommended");
  const [selectedModule, setSelectedModule] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string[]>([]);

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

  const modules = new Set(selectedModule);
  const categories = new Set(selectedCategory);
  const years = new Set(selectedYear);
  const hasActiveControls = selectedModule.length > 0 || selectedCategory.length > 0 || selectedYear.length > 0 || sortOrder !== "recommended";
  const search = query.trim().toLocaleLowerCase();
  const filteredItems = showControls
    ? items.filter((item) => {
        const matchesSearch =
          item.title.toLocaleLowerCase().includes(search) ||
          item.studentName.toLocaleLowerCase().includes(search) ||
          item.module.title.toLocaleLowerCase().includes(search);

        const matchesModule =
          selectedModule.length === 0 ||
          modules.has(String(item.module.number));

        const matchesCategory =
          selectedCategory.length === 0 ||
          categories.has(getCategory(item));

        const itemYear = new Date(item.createdAt).getFullYear();
        const matchesYear =
          selectedYear.length === 0 ||
          years.has(String(itemYear));

        return matchesSearch && matchesModule && matchesCategory && matchesYear;
      })
    : items;

  return (
    <AppliedGalleryLayout $enabled={showControls}>
      {showControls && <>
      <GalleryDevTools />
      <SearchWrapper data-gallery-layout="search">
        <FiSearch size={18} aria-hidden="true" />
        <GallerySearch
          type="search"
          placeholder="Search by project, student or module"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </SearchWrapper>


      <FilterControls data-gallery-layout="filters" data-clear-visible={hasActiveControls}>
        <GalleryMultiFilter label="Filter by module" allLabel="All modules"
          options={moduleOptions.map(([number, title]) => ({ value: String(number), label: "Module " + number + ": " + title }))}
          selected={selectedModule} onChange={setSelectedModule} />
        <GalleryMultiFilter label="Filter by category" allLabel="All categories"
          options={[{value: "design", label: "Design"}, {value: "web", label: "Web"}, {value: "other", label: "Other"}]}
          selected={selectedCategory} onChange={setSelectedCategory} />
        <GalleryMultiFilter label="Filter by year" allLabel="All years"
          options={yearOptions.map(year => ({value: String(year), label: String(year)}))}
          selected={selectedYear} onChange={setSelectedYear} />
        <GallerySort data-gallery-layout="sort">
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
        {hasActiveControls && <ResetIntroduction userId={userId}>
        <GalleryReset
          type="button"
          onClick={() => {
            setQuery("");
            setSelectedModule([]);
            setSelectedCategory([]);
            setSelectedYear([]);
            setSortOrder("recommended");
          }}
        >
          Clear all
        </GalleryReset>
        </ResetIntroduction>}
      </FilterControls>
      </>}

      {showControls && <p data-gallery-layout="count" aria-live="polite">{filteredItems.length} {filteredItems.length === 1 ? "project" : "projects"}</p>}

      {filteredItems.length === 0 ? (
        <GalleryEmpty>
          <p>No projects match your current filters.</p>
        </GalleryEmpty>
      ) : (
        <GalleryGrid data-gallery-layout="cards">
          {sortGalleryItems(filteredItems, sortOrder).map((item) => (
            <GalleryItem key={item.returnId} item={item} />
          ))}
        </GalleryGrid>
      )}
    </AppliedGalleryLayout>
  );
};

export default Gallery;

