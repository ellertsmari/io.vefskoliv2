"use client";
import styled from "styled-components";

const breakpoint = "940px";

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
export const HeaderContainer = styled.div`
  width: 100%;
  padding: 60px;
  padding-top: 58px;
`;
export const Main = styled.div`
  width: 100%;
  height: 241px;
  border-radius: 8px;
  grid-area: main;
`;
