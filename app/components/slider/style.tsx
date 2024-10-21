import { SmallText } from "globalStyles/text";
import styled from "styled-components";

export const SliderContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const SliderTrack = styled.div`
  width: 100%;
  height: 3px;
  padding: 0 6px;
  background-color: var(--theme-module3-30);
  border-radius: 5px;
  position: relative;
`;

export const SliderThumb = styled.div<{ $Left?: string }>`
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: ${({ $Left }) =>
    $Left ? "var(--theme-module3-100)" : "var(--theme-module3-60)"};
  border-radius: 50%;
  top: 50%;
  left: ${({ $Left }) => $Left ?? "50%"};
  transform: translateY(-50%);
  cursor: pointer;
`;

export const ValueContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const OptionValue = styled.p<{ $selected?: boolean }>`
  color: ${({ $selected }) =>
    $selected ? "var(--theme-module3-100)" : undefined};
  font-size: ${({ $selected }) => ($selected ? "1.25rem" : "1rem")};
  font-weight: ${({ $selected }) => ($selected ? "bold" : "normal")};
`;

export const SliderHelpLink = styled.a`
  //   color: var(--theme-module3-100);
  text-decoration-line: none;
  align-self: flex-end;
`;

export const SliderHelpLinkText = styled(SmallText)`
  color: var(--theme-module3-100);
`;
