"use client";
import styled, { keyframes } from "styled-components";

const radius = "8px";

const fadeIn = keyframes`
  0% {
    max-height: 40px;
  }
  100% {
    max-height: 500px; 
  }
`;

const fadeOut = keyframes`
  0% {
    max-height: 500px;
    border: solid 1px var(--theme-module3-100);
  }
  100% {
    max-height: 0;
    border: none;
  }
`;

export const DropDownContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  height: 80px;
`;

export const AccordianContainer = styled.div`
  display: flex;
  justify-content: center;
  height: 42px;
  width: 100%;
  max-width: 240px;
  position: absolute;
`;

export const Accordian = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 3rem;
  position: relative;
  width: 100%;

  @media (min-width: 768px) {
    padding: 0.8rem 1rem;
  }
`;
interface AccordianTitleProps {
  expanded?: "yes" | "no";
}

export const AccordianTitle = styled(Accordian)<AccordianTitleProps>`
  border-radius: ${radius};
  height: 42px;
  background-color: var(--theme-module3-100);
  color: white;
  gap: 1rem;

  @media (min-width: 768px) {
    height: 60px;
  }

  ${(props) =>
    props.expanded === "yes" && `border-radius: ${radius} ${radius} 0 0;`}
`;

AccordianTitle.defaultProps = {
  expanded: "no",
};

export const AccordianText = styled.p`
  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

interface AccordianExpandedProps {
  isOpen: boolean;
}

export const AccordianExpanded = styled.div<AccordianExpandedProps>`
  display: flex;
  position: absolute;
  width: 100%;
  border-radius: ${radius};
  overflow: hidden;
  top: 0;
  left: 0;
  flex-direction: column;
  background-color: white;
  border: solid 1px var(--theme-module3-100);
  border-top: none;
  color: var(--primary-black-60);
  padding: 0;
  text-align: center;
  height: auto;
  border: ${(props) =>
    props.isOpen ? "solid 1px var(--theme-module3-100)" : "none"};
  max-height: ${(props) => (props.isOpen ? "500px" : 0)};
  animation: ${(props) => (props.isOpen ? fadeIn : fadeOut)} 0.5s ease-in-out;
`;

export const AccordianOptionContainer = styled(Accordian)`
  &:hover {
    background-color: var(--theme-module3-100);
    color: white;
  }
`;
