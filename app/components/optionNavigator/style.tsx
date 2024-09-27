import { StyleColors } from "globalStyles/colors";
import styled from "styled-components";

const BREAKPOINT = "680px";

export const OptionsContainer = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
  height: fit-content;
  width: fit-content;
`;

export const Option = styled.div<{ $color: StyleColors }>`
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  width: 10px;
  height: 10px;
  cursor: pointer;
`;

export const SelectedRing = styled.div`
  border: 2px solid var(--theme-module3-100);
  background-color: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const ArrowContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  height: 18px;
  width: 12px;
  @media (min-width: ${BREAKPOINT}) {
    height: 24px;
    width: 16px;
  }
`;
