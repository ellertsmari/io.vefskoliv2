import styled from "styled-components";

const BREAKPOINT = "680px";

export const Option = styled.div<{ selected: boolean }>`
  ${(props) =>
    props.selected
      ? "color: var(--primary-white); background-color:var(--theme-module3-100)"
      : "color:var(--theme-module3-100); "};
  padding: 4px 8px;
  min-width: 80px;
  position: relative;
  text-align: center;
  font-size: 12px;

  @media (min-width: ${BREAKPOINT}) {
    padding: 8px 12px;
    min-width: 110px;
    font-size: 14px;
  }
`;

export const NotificationIconContainer = styled.div`
  position: absolute;
  height: 22px;
  width: 22px;
  top: -11px;
  right: -10px;
  z-index: 1;
`;

export const ToggleContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
  width: fit-content;
  height: fit-content;
  border: 1px solid var(--theme-module3-100);
  border-radius: 8px;
`;
