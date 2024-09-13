"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown } from "../../arrowDown";
import {
  Accordian,
  AccordianOptionContainer,
  AccordianText,
  Container,
  DropDownContainer,
  animationDuration,
} from "./style";
import { ArrowUp } from "../../arrowUp";

export type DropdownOption = {
  optionName: string;
  onClick: () => void;
};

interface DropdownProps {
  options: DropdownOption[];
  titleOption: DropdownOption;
  style?: React.CSSProperties;
  zIndex?: number;
}

export const Dropdown = ({
  options,
  titleOption,
  style,
  zIndex,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState(titleOption.optionName);
  const [showOptions, setShowOptions] = useState(false);

  const handleOnClick = (optionName: string) => {
    if (isOpen) {
      setTimeout(() => {
        setShowOptions(false);
      }, animationDuration * 1000);
    } else {
      setShowOptions(true);
    }
    setIsOpen(!isOpen);

    setCurrentOption(optionName);
  };

  const Options = useMemo(() => {
    return options.map((option, index) => {
      const { optionName, onClick } = option;

      return (
        <AccordianOptionContainer
          key={index}
          onClick={() => {
            handleOnClick(optionName);
            onClick();
          }}
        >
          <AccordianText>{optionName}</AccordianText>
        </AccordianOptionContainer>
      );
    });
  }, [options, isOpen]);

  return (
    <Container style={style}>
      <DropDownContainer $isOpen={isOpen} $zIndex={zIndex}>
        <Accordian
          onClick={() => {
            handleOnClick(titleOption.optionName);
            showOptions && titleOption.onClick();
          }}
          $title
        >
          <AccordianText>{currentOption.toUpperCase()}</AccordianText>
          {isOpen ? <ArrowUp /> : <ArrowDown />}
        </Accordian>
        {showOptions && Options}
      </DropDownContainer>
    </Container>
  );
};
