"use client";
import { SubHeading1 } from "globalStyles/text";
import styled from "styled-components";

export const UserInfoCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const InfoSubtitle = styled(SubHeading1)`
  @media (max-width: 430px) {
    display: none;
  }
`;
