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
  /* Capsules size to their labels now, so let the row wrap instead of
     squeezing fixed-width pills with space-between. */
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 12px 16px;
`;

export const CapsuleButton = styled.button<{$active: boolean}>`
  /* Sized by content: module titles ("2 - Community & Networking") are much
     longer than the old "Module 3" labels and overflowed the fixed 120x28 pill. */
  width: auto;
  min-height: 28px;
  padding: 4px 18px;
  white-space: nowrap;
  flex: 0 0 auto;
  font-size: 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--primary-black-100);
  background-color: ${({$active}) => ($active ? "black" : "white")};
  color: ${({$active}) => ($active ? "white" : "black")};
  cursor: pointer;

  &:hover{
    background-color: var(--primary-black-10);
  }
`

