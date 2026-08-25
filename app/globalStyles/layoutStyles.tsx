"use client";
import styled from "styled-components";
import Image from "next/image";

const breakpoint =  "840px";

export const LayoutGrid = styled.div`
  display: grid;
  grid-template-rows: auto 15fr;
  grid-template-areas:
    "topbar"
    "main"
    "navbar";
  padding: 1rem;
  gap: 1rem;
  width: 100%;
  height: 100dvh;
  grid-auto-rows: min-content;

  @media (min-width: ${breakpoint}) {
    /* Only the collapsed rail is reserved — the nav expands over the content
       on hover rather than pushing it sideways. */
    grid-template-columns: var(--nav-collapsed) minmax(0, 1fr);
    grid-template-rows: auto 15fr;
    grid-template-areas:
      "topbar topbar"
      "navbar main";
  }
`;

export const Background = styled(Image)`
  width: 100%;
  height: auto;
  position: fixed;
  z-index: -1;
  left: 0;
`

export const NavigationContainer = styled.div`
  max-height: 100dvh;
  width: 100%;
  grid-area: navbar;

  @media (min-width: ${breakpoint}) {
    /* Anchors the expanding nav panel, which is taken out of flow so that
       sliding it open overlays the page instead of resizing the grid track. */
    position: relative;
  }
`;
export const TopbarContainer = styled.div`
  width: 100%;
  grid-area: topbar;
`;
export const Main = styled.div`
  max-width: 100%;
  height: 100%;
  /* overflow:scroll renders a scrollbar permanently, even on pages that fit. */
  overflow: auto;
  grid-area: main;
`;
