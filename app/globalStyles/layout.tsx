"use client";
import styled from "styled-components";

const breakpoint = "768px";

export const LayoutGrid = styled.div`
  display: grid;
  grid-template-rows: auto 15fr;
  grid-template-areas:
    "navbar"
    "main";
  width: 100%;
  height: 100dvh;
  grid-auto-rows: min-content;

  @media (min-width: ${breakpoint}) {
    grid-template-columns: minmax(0, 350px) auto;
    grid-template-rows: auto 15fr;
    grid-template-areas:
      "sidebar navbar"
      "sidebar main";
  }
`;

export const SidebarContainer = styled.div`
  max-height: 100dvh;
  width: 100%;
  grid-area: sidebar;
  display: none;
  background-color: #fffffff;

  @media (min-width: ${breakpoint}) {
    display: block;
  }
`;
export const NavbarContainer = styled.div`
  width: 100%;
  grid-area: navbar;
`;
export const Main = styled.div`
  max-width: 100%;
  height: 100%;
  overflow: scroll;
  background-color: #fafafa;
  grid-area: main;
`;
