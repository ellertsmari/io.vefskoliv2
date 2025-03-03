"use client";

import { SidebarContainer } from "globalStyles/gridtemplate";
import Image from "next/image";
import styled from "styled-components";
import frame1 from "../../public/Frame1.svg";

export const MainContainer = styled.div`
  display: grid;
  grid-template-areas: "sidebar main";
  grid-template-columns: 2fr 1fr;
  grid-auto-flow: column;
  gap: 40px;
  padding: 40px;
  padding-top: 143px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* Stack the columns */
    grid-template-areas:
      "sidebar"
      "main"; /* Adjust grid layout to stack vertically */
    gap: 20px; /* Reduce gap between items */
    padding: 20px; /* Adjust padding for smaller screens */
    padding-top: 100px; /* Adjust padding-top for smaller screens */
  }
`;

export const NewSidebarContainer = styled.div`
  grid-area: sidebar;
  gap: 40px;
`;

export const RightSideMain = styled.div`
  grid-area: main;
`;
console.log(frame1.src);
export const BackgroundDiv = styled.div`
  background-color: white;
  background-image: url(${frame1.src});
  background-size: cover;

  height: 100%;
`;
