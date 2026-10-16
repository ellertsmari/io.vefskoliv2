"use client";
import styled from "styled-components";

/**
 * With controls on, this wrapper is `display: contents`, so the search, filters,
 * count and cards become flex items of the page container (a wrapping row).
 * The search shares a row with the page description only while both fit; the
 * moment they would touch it wraps below, at any width, with no breakpoint.
 * Real flow instead of transforms also keeps the cards from painting over
 * open dropdowns.
 */
export const AppliedGalleryLayout = styled.div<{ $enabled: boolean }>`
  width: 100%;
  ${({ $enabled }) => $enabled && `
    display: contents;

    > * { flex: 0 0 100%; min-width: 0; }

    > [data-gallery-layout="search"] {
      flex: 0 1 443px;
      min-width: min(300px, 100%);
      margin: 0 0 28px auto;
    }

    /* From 1100px the filters sit on one row; every control is 44px tall. */
    @media (min-width: 1100px) {
      [data-gallery-layout="filters"] {
        max-width: none;
        grid-template-columns: repeat(3, 158.75px) minmax(0, 1fr);
      }
      [data-gallery-layout="filters"][data-clear-visible="true"] {
        grid-template-columns: repeat(3, 158.75px) minmax(0, 1fr) auto;
      }
      [data-gallery-layout="sort"] { justify-self: end; width: 252px; }
      [data-gallery-layout="filters"] > [data-gallery-layout="clear"] { grid-column: auto; }
      [data-gallery-layout="count"] { margin: 0 0 16px; color: var(--primary-black-60); }
      [data-gallery-layout="cards"] { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
  `}
`;
