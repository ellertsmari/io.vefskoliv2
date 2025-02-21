'use client'

import { SidebarContainer } from "globalStyles/layout";
import Image from "next/image";
import styled from "styled-components";

export const MainContainer = styled.div`
  display: grid;
  grid-template-areas
  : "sidebar main"
  ;
  grid-template-columns: 150px 1fr;
` 

export const NewSidebarContainer = styled.div`
grid-area: sidebar;
`

export const Main = styled (Image)`
grid-area: main;
`
  