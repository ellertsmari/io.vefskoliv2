"use client";
import { useMemo, useState } from "react";
import { ArrowDown } from "../../arrowDown";
import {
  AccordianContainer,
  AccordianExpanded,
  AccordianOptionContainer,
  AccordianText,
  AccordianTitle,
  DropDownContainer,
} from "./style";
import { ArrowUp } from "../../arrowUp";

interface DropDownProps {
  title: string;
  options: { optionName: string; onClick?: () => void }[];
  currentOption: string | undefined;
}

export const DropDown = ({ title, options, currentOption }: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
                  setIsOpen(!isOpen);
                }
              : () => setIsOpen(!isOpen)
          }
        >
          <AccordianText>{optionName}</AccordianText>
        </AccordianOptionContainer>
      );
    });
  }, [options, isOpen]);

  return (
    <DropDownContainer>
      <AccordianContainer>
        {!isOpen ? (
          <AccordianTitle onClick={() => setIsOpen(!isOpen)}>
            <AccordianText>
              {currentOption
                ? currentOption.toUpperCase()
                : title.toUpperCase()}
            </AccordianText>
            <ArrowDown />
          </AccordianTitle>
        ) : (
          <AccordianExpanded>
            <AccordianTitle onClick={() => setIsOpen(!isOpen)} expanded={"yes"}>
              <AccordianText>{title.toUpperCase()}</AccordianText>
              <ArrowUp />
            </AccordianTitle>
            {Options}
          </AccordianExpanded>
        )}
      </AccordianContainer>
    </DropDownContainer>
  );
};
