'use client';

import type { GalleryItem as GalleryItemType } from "app/serverActions/getGallery";
import GalleryItem from "./GalleryItem";
import { GalleryGrid, GalleryEmpty } from "./styles";

interface GalleryProps {
  items: GalleryItemType[];
}

const Gallery = ({ items }: GalleryProps) => {
  if (!items || items.length === 0) {
    return (
      <GalleryEmpty>
        <h3>Gallery Coming Soon</h3>
        <p>Featured student projects will be displayed here once they are recommended by peers.</p>
      </GalleryEmpty>
    );
  }

  return (
    <GalleryGrid>
      {items.map((item) => (
        <GalleryItem key={item.returnId} item={item} />
      ))}
    </GalleryGrid>
  );
};

export default Gallery;

