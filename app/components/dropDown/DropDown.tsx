"use client";
import { useMemo, useState } from "react";
import { ArrowDown } from "../../arrowDown";
import {
  Accordian,
  AccordianOptionContainer,
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
          <p>{optionName}</p>
        </AccordianOptionContainer>
      );
    });
  }, [options, isOpen]);

  return (
    <Container style={style}>
      <DropDownContainer $isOpen={isOpen} $zIndex={zIndex}>
        <Accordian onClick={() => handleOnClick(title)} $title>
          <p>{currentOption.toUpperCase()}</p>
          {isOpen ? <ArrowUp /> : <ArrowDown />}
        </Accordian>
        {showOptions && Options}
      </DropDownContainer>
    </Container>
  );
};
