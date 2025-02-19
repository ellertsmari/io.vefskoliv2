"use client";
import styled from "styled-components";

const breakpoint = "768px";

export const LayoutGrid = styled.div`
  display: grid;
  grid-template-rows: auto 15fr;
  grid-template-areas:
    "navbar"
    "main";

  gap: 1rem;
  width: 100%;
  height: 100dvh;
  grid-auto-rows: min-content;

  @media (min-width: ${breakpoint}) {
    grid-template-columns: minmax(0, 234px) auto;
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
  border-radius: 0.8rem;
  display: none;

  @media (min-width: ${breakpoint}) {
    display: block;
  }
`;
export const NavbarContainer = styled.div`
  width: 100%;
  grid-area: navbar;
  padding: 1rem;
`;
export const Main = styled.div`
  padding: 1rem;
  max-width: 100%;
  height: 100%;
  overflow: scroll;
  background-color: white;
  border: solid 1px #6563eb;
  border-radius: 0.8rem;
  grid-area: main;
`;
