"use client";

import { useState } from "react";
import { Container, ModuleContainer, ModuleOptionContainer } from "./style";
import { FilterButton } from "./filterButton";

export type ModuleOption = {
  optionName: string;
  onClick: () => void;
};

interface ModuleProps {
  options: ModuleOption[];
  currentOption?: ModuleOption;
  style?: React.CSSProperties;
  zIndex?: number;
  setFilter: React.Dispatch<
    React.SetStateAction<{ tagStatus: string; guideCategory: string }>
  >;
}

export const Module = ({
  options,
  style,
  currentOption,
  zIndex,
  setFilter,
}: ModuleProps) => {
  const [shownOption, setShownOption] = useState(
    currentOption?.optionName ?? options[0]?.optionName
  );

  const handleOnClick = (optionName: string, onClick: () => void) => {
    setShownOption(optionName);
    onClick();
  };

  return (
    <Container style={style}>
      <ModuleContainer $zIndex={zIndex}>
        {options.map((option, index) => {
          const { optionName, onClick } = option;
          return (
            <ModuleOptionContainer
              key={index}
              onClick={() => handleOnClick(optionName, onClick)}
            >
              <p>{optionName}</p>
            </ModuleOptionContainer>
          );
        })}
      </ModuleContainer>
      <FilterButton
        setFilter={setFilter}
        filter={{ tagStatus: "", guideCategory: "" }}
      />
    </Container>
  );
};
