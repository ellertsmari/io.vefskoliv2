"use client";
import styled from "styled-components";

// Container-relative alignment reproduces the saved 1738px desktop canvas.
export const AppliedGalleryLayout = styled.div<{ $enabled: boolean }>`
  width: 100%;
  ${({ $enabled }) => $enabled && `
    @media (min-width: 1100px) {
      [data-gallery-layout="search"] {
        width: min(443px, 100%); max-width: 443px; height: 48px;
        margin-left: auto; transform: translateY(-79px);
      }
      [data-gallery-layout="search"] > input { height: 100%; box-sizing: border-box; }
      [data-gallery-layout="filters"] {
        width: 100%; max-width: none; height: 46px;
        grid-template-columns: repeat(3, 158.75px) minmax(0, 1fr);
        transform: translateY(-89px);
      }
      [data-gallery-layout="module"] { width: 158.75px; height: 44px; transform: translate(6px, 10px); }
      [data-gallery-layout="category"] { width: 158.75px; height: 44px; transform: translate(5px, 8px); }
      [data-gallery-layout="year"] { width: 158.75px; height: 44px; transform: translate(4px, 6px); }
      [data-gallery-layout="module"] > summary,
      [data-gallery-layout="category"] > summary,
      [data-gallery-layout="year"] > summary { height: 100%; box-sizing: border-box; }
      [data-gallery-layout="sort"] {
        justify-self: end; width: 252px; height: 45px;
        transform: translate(-1.75px, 1px);
      }
      [data-gallery-layout="sort"] > select { height: 100%; box-sizing: border-box; }
      /* Clear all sits directly left of Sort (252px + 12px gap), ending where the search ends. */
      [data-gallery-layout="filters"] > [data-gallery-layout="clear"] {
        position: absolute; top: 1px; right: 264px; height: 45px;
      }
      [data-gallery-layout="clear"] > button { height: 100%; box-sizing: border-box; }
      [data-gallery-layout="count"] {
        margin: 0 0 24px; color: var(--primary-black-60); transform: translateY(-58px);
      }
      [data-gallery-layout="cards"] {
        width: 100%; grid-template-columns: repeat(4, minmax(0, 1fr));
        transform: translateY(-58px);
      }
    }
  `}
`;
