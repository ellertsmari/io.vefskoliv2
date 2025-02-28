"use client";

import { SidebarContainer } from "globalStyles/gridtemplate";
import Image from "next/image";
import styled from "styled-components";
import frame1 from "../../public/Frame1.svg";

export const MainContainer = styled.div`
  display: grid;
  grid-template-areas: "sidebar main";
  grid-template-columns: 2fr 1fr;
  gap: 40px

`;

export const NewSidebarContainer = styled.div`
  grid-area: sidebar;
  gap: 40px
`;

export const RightSideMain = styled.div`
  grid-area: main;
`;
console.log(frame1.src);
export const BackgroundDiv = styled.div`
  background-color: white;
  background-image: url(${frame1.src});
  background-size: cover;
  width: 100%;
  height: 100%;
`;
