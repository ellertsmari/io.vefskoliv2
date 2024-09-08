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

interface DropDownProps {
  title: string;
  options: { optionName: string; onClick?: () => void }[];
  currentOption: string | undefined;
}

export const DropDown = ({ title, options, currentOption }: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleOnClick = () => {
    if (isOpen) {
      setIsOpen(false);
      setTimeout(() => {
        setShowOptions(false);
      }, animationDuration * 1000);
    } else {
      setShowOptions(true);
      setIsOpen(true);
    }
  };

  const Options = useMemo(() => {
    return options.map((option, index) => {
      const { optionName, onClick } = option;

      return (
        <AccordianOptionContainer
          key={index}
          onClick={
            onClick
              ? () => {
                  onClick();
                  handleOnClick();
                }
              : () => handleOnClick()
          }
        >
          <AccordianText>{optionName}</AccordianText>
        </AccordianOptionContainer>
      );
    });
  }, [options, isOpen]);

  return (
    <Container>
      <DropDownContainer $isOpen={isOpen}>
        <Accordian onClick={handleOnClick} $title>
          <AccordianText>
            {currentOption ? currentOption.toUpperCase() : title.toUpperCase()}
          </AccordianText>
          {isOpen ? <ArrowUp /> : <ArrowDown />}
        </Accordian>
        {showOptions && Options}
      </DropDownContainer>
    </Container>
  );
};
