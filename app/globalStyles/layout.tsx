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
    grid-template-columns: minmax(0,150px) auto;
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
    display: block;
    
  }
`;
export const TopbarContainer = styled.div`
  width: 100%;
  grid-area: topbar;
`;
export const Main = styled.div`
  max-width: 100%;
  height: 100%;
  overflow: scroll;
  grid-area: main;
`;
