"use client";
import styled, { keyframes } from "styled-components";

const minHeightSmall = "42px";
const minHeightLarge = "54px";
const maxHeight = "500px";
const breakPoint = "768px";

const fadeInSmall = keyframes`
  0% {
    max-height: ${minHeightSmall};
  }
  100% {
    max-height: ${maxHeight}; 
  }
`;

const fadeInLarge = keyframes`
  0% {
    max-height: ${minHeightLarge};
  }
  100% {
    max-height: ${maxHeight}; 
  }
`;

const fadeOutSmall = keyframes`
  0% {
    max-height: ${maxHeight};
  }
  100% {
    max-height: ${minHeightSmall};
  }
`;

const fadeOutLarge = keyframes`
  0% {
    max-height: ${maxHeight};
  }
  100% {
    max-height: ${minHeightLarge};
  }
`;

export const Container = styled.div`
  min-height: ${minHeightSmall};
  position: relative;
  height: auto;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow-y: scroll;
  @media (min-width: ${breakPoint}) {
    display: flex;
    gap: 24px;
  }
    @media (max-width: ${breakPoint}) {
    display: flex;
    gap: 24px;
  }
`;

export const CapsuleButton = styled.button<{$active: boolean}>`
  width: 120px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid var(--primary-black-100);
  background-color: ${({$active}) => ($active ? "black" : "white")};
  color: ${({$active}) => ($active ? "white" : "black")};
  cursor: pointer;

  &:hover{
    background-color: var(--primary-black-10);
  }
`

