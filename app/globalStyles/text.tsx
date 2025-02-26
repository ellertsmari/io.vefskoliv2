"use client";
import styled from "styled-components";

export const SubTitle = styled.h2`
  font-family: poppins;
  font-size: 16px;
  font-weight: medium;
  color: var(--Dark-blue, #2b5b76);
`;

export const SubTitleLabel = styled.label`
  font-size: 16px;
  font-weight: 400;
  color: var(--theme-module3-100);
`;

export const BlackSubTitle = styled(SubTitle)`
  font-size: 16px;
  font-weight: 400;
  color: var(--primary-black-100);
`;

export const BlueSubTitle = styled(SubTitle)`
  font-size: 16px;
  font-weight: 400;
  color: #2b5b76;
`;

export const Title = styled.h1`
  color: var(--Dark-blue, #2b5b76);
  grid-area: main;
  font-weight: bold;
  font-size: 24px;
`;

export const SmallText = styled.p`
  font-size: 12px;
`;

export const BlueSmallText = styled.p`
  font-size: 12px;
  color: #2b5b76;
`;
