"use client";
import styled, { keyframes } from "styled-components";

const radius = "8px";
const minHeightSmall = "42px";
const minHeightLarge = "54px";
const maxHeight = "500px";
export const animationDuration = 0.5;
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
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  height: fit-content;
  width: 100%;
  position: relative;
`;

interface DropDownContainerProps {
  isOpen: boolean;
}

export const DropDownContainer = styled.div<DropDownContainerProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  margin: 10px;
  min-width: 200px;
  top: 0;
  z-index: 1;
  border-radius: ${radius};
  border: 1px solid var(--theme-module3-100);
  height: auto;
  overflow: hidden;
  max-height: ${(props) => (props.isOpen ? maxHeight : minHeightSmall)};
  animation: ${(props) => (props.isOpen ? fadeInSmall : fadeOutSmall)}
    ${animationDuration}s ease-in-out;

  @media (min-width: ${breakPoint}) {
    max-height: ${(props) => (props.isOpen ? maxHeight : minHeightLarge)};
    animation: ${(props) => (props.isOpen ? fadeInLarge : fadeOutLarge)}
      ${animationDuration}s ease-in-out;
    min-width: 240px;
  }
`;

interface AccordianProps {
  title?: boolean;
}

export const Accordian = styled.div<AccordianProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px 2rem;
  gap: 1rem;
  height: fit-content;
  color: ${(props) => (props.title ? "white" : "black")};
  background-color: ${(props) =>
    props.title ? "var(--theme-module3-100)" : "white"};
  // background-color: $ var(--theme-module3-100);
  width: 100%;
`;

export const AccordianText = styled.p`
  @media (min-width: 768px) {
    font-size: 1.2rem;
  }
`;

export const AccordianOptionContainer = styled(Accordian)`
  &:hover {
    background-color: var(--theme-module3-100);
    color: white;
  }
`;
