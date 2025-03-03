"use client";
import styled from "styled-components";
import frame1 from "../../public/Frame1.svg";
const breakpoint = "768px";

export const LayoutGrid = styled.div<{ bg: string }>`
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

  background: ${({ bg }) =>
    bg ||
    "linear-gradient(to bottom,rgba(117, 43, 54, 1) 0%,rgba(219, 79, 99, 1) 31%,rgba(117, 43, 54, 1) 88%)"};

  @media (min-width: ${breakpoint}) {
    grid-template-rows: auto 1fr;
    grid-template-areas:
      "navbar navbar"
      "sidebar main";
  }
`;

export const SidebarContainer = styled.div`
  width: 100px;
  grid-area: sidebar;
  border-radius: 0.8rem;
  display: none;
  position: relative;
  @media (min-width: ${breakpoint}) {
    display: block;
  }
`;
export const NavbarContainer = styled.div`
  width: 100%;
  grid-area: navbar;
  height: 180px;
`;
export const Main = styled.div`
  max-width: 100%;
  height: 100%;
  overflow: scroll;

  border: solid 1px #6563eb;

  grid-area: main;
`;
