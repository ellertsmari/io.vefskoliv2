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

  useEffect(() => {
    console.log("currentOption", currentOption);
    console.log("isOpen", isOpen);
    console.log("showOptions", showOptions);
  }, [currentOption, isOpen, showOptions]);

  const handleOnClick = (optionName: string, isTitleClicked?: boolean) => {
    if (isOpen) {
      setTimeout(() => {
        setShowOptions(false);
      }, animationDuration * 1000);
    } else {
      setShowOptions(true);
    }
    setIsOpen(!isOpen);
    isTitleClicked && showOptions && options[0].onClick
      ? (setCurrentOption(title), options[0].onClick())
      : setCurrentOption(optionName);
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
        <Accordian onClick={() => handleOnClick(title, true)} $title>
          <AccordianText>{currentOption.toUpperCase()}</AccordianText>
          {isOpen ? <ArrowUp /> : <ArrowDown />}
        </Accordian>
        {showOptions && Options}
      </DropDownContainer>
    </Container>
  );
};
