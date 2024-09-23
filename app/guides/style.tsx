"use client";

import styled from "styled-components";

const BREAKPOINT = "1191px";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const GuideContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 32px;
  padding: 32px;
  width: 100%;
`;

export const GuideDropdownContainer = styled.div`
  display: flex;
  padding: 32px 32px 0 32px;
  align-items: center;
  width: 100%;
  justify-content: center;
  @media (min-width: ${BREAKPOINT}) {
    justify-content: flex-start;
  }
`;
