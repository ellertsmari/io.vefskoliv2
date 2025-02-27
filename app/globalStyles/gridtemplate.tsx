"use client";
import styled from "styled-components";

const breakpoint = "768px";

export const LayoutGrid = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "navba navbar"
    "sidebar main";
  gap: 1rem;
  width: 100%;
  grid-auto-rows: min-content;
  grid-auto-flow: row;

  background: linear-gradient(
    to bottom,
    rgba(117, 43, 54, 1) 0%,
    rgba(219, 79, 99, 1) 31%,
    rgba(117, 43, 54, 1) 88%
  );

  @media (min-width: ${breakpoint}) {
    grid-template-columns: minmax(0, 100px) auto;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      "navbar navbar"
      "sidebar main";
  }
`;

export const SidebarContainer = styled.div`
  height: 100dvh;
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
`;
export const Main = styled.div`
  max-width: 100%;
  height: 100%;
  overflow: scroll;
  background-color: white;
  border: solid 1px #6563eb;

  grid-area: main;
`;
