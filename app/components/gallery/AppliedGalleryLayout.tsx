"use client";
import styled from "styled-components";

// Desktop layout uses real margins, not transforms: transforms leave the old
// space behind, stagger the controls and paint the cards over open dropdowns.
export const AppliedGalleryLayout = styled.div<{ $enabled: boolean }>`
  width: 100%;
  ${({ $enabled }) => $enabled && `
    /* From 1100px the filters sit on one row; every control is 44px tall. */
    @media (min-width: 1100px) {
      [data-gallery-layout="filters"] {
        max-width: none;
        margin-bottom: 16px;
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

    /* Only with room beside the description does the search move up next to it, so it never covers the text. */
    @media (min-width: 1400px) {
      [data-gallery-layout="search"] {
        width: 443px;
        margin: -72px 0 28px auto;
      }
    }
  `}
`;
