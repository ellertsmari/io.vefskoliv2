import { SmallText } from "globalStyles/text";
import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const SliderContainer = styled.div`
  position: relative;
  height: 12px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const SliderTrack = styled.input<{
  $selectable?: boolean;
  $sliderPercentage: number;
}>`
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;

  /* Style the track  */
  &::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      ${({ $selectable }) =>
          $selectable ? "var(--theme-module3-100)" : "var(--theme-module3-30)"}
        ${(props) => props.$sliderPercentage + "%"},
      var(--theme-module3-30) ${(props) => props.$sliderPercentage}%
    );
    height: 3px;
    border-radius: 8px;
    width: 100%;
  }

  &::-moz-range-track {
    background: linear-gradient(
      to right,
      ${({ $selectable }) =>
          $selectable ? "var(--theme-module3-100)" : "var(--theme-module3-30)"}
        ${(props) => props.$sliderPercentage + "%"},
      var(--theme-module3-30) ${(props) => props.$sliderPercentage}%
    );
    height: 3px;
    border-radius: 5px;
  }

  &::-ms-track {
    border-color: transparent;
    background: linear-gradient(
      to right,
      ${({ $selectable }) =>
          $selectable ? "var(--theme-module3-100)" : "var(--theme-module3-30)"}
        ${(props) => props.$sliderPercentage + "%"},
      var(--theme-module3-30) ${(props) => props.$sliderPercentage}%
    );
    border-radius: 8px;
    height: 3px;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ $selectable }) =>
      $selectable ? "var(--theme-module3-100)" : "var(--theme-module3-60)"};
    cursor: pointer;
    margin-top: -4px;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ $selectable }) =>
      $selectable ? "var(--theme-module3-100)" : "var(--theme-module3-60)"};
    cursor: pointer;
  }

  &::-ms-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ $selectable }) =>
      $selectable ? "var(--theme-module3-100)" : "var(--theme-module3-60)"};
    cursor: pointer;
  }

  width: 100%;
  height: 3px;
  padding-right: 1rem;
`;

export const ValueContainer = styled.ul`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const OptionValue = styled.label<{ $selected?: boolean }>`
  list-style: none;
  color: ${({ $selected }) =>
    $selected ? "var(--theme-module3-100)" : undefined};
  font-size: ${({ $selected }) => ($selected ? "1.25rem" : "1rem")};
  font-weight: ${({ $selected }) => ($selected ? "bold" : "normal")};
  flex: 1;
`;

export const SliderHelpLink = styled.a`
  text-decoration-line: none;
  align-self: flex-end;
`;

export const SliderHelpLinkText = styled(SmallText)`
  color: var(--theme-module3-100);
`;

export const GradeSlider = styled.input`
  color: blue;
  width: 100%;
`;
