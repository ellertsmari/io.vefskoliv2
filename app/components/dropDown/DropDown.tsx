"use client";
import { useMemo, useState } from "react";
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

interface DropdownProps {
  options: { optionName: string; onClick?: () => void }[];
  title: string;
  initialOption?: string;
  style?: React.CSSProperties;
  zIndex?: number;
}

export const Dropdown = ({
  options,
  title,
  initialOption,
  style,
  zIndex,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState(initialOption ?? title);
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
            if (onClick) {
              onClick();
            }
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
        <Accordian onClick={() => handleOnClick(title)} $title>
          <AccordianText>{currentOption.toUpperCase()}</AccordianText>
          {isOpen ? <ArrowUp /> : <ArrowDown />}
        </Accordian>
        {showOptions && Options}
      </DropDownContainer>
    </Container>
  );
};
