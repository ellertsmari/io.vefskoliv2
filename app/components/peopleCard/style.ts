"use client";
import { SubTitle } from "globalStyles/text";
import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  padding: 32px;
  gap: 32px;
`;

export const UserInfoCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const InfoWrapper = styled.div`
  border: 1px solid var(--theme-module3-100);
  border-radius: 8px;
  padding: 1rem;
  display: grid;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: auto auto;
    grid-auto-flow: row;
    grid-auto-rows: auto;
    gap: 2rem;
  }
`;

export const InfoSubtitle = styled(SubTitle)`
  @media (max-width: 430px) {
    display: none;
  }
`;
