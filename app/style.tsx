'use client'
import styled from "styled-components";

export const PageWrapper = styled.div`
  display: grid;
  grid-template-areas: 
  "navbar navbar"
  "sidebar main" 
  ;
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
  background: linear-gradient(to bottom,
      rgba(117, 43, 54, 1) 0%,
      rgba(219, 79, 99, 1) 31%,
      rgba(117, 43, 54, 1) 88%);
`;

export const NavWrapper = styled.div`
 
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
  
`;