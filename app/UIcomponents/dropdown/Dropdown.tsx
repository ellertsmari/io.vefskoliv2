"use client";
import { useMemo } from "react";
import { Container, CapsuleButton } from "./style";

export type Option = {
  optionName: string;
  onClick: () => void;
};

interface OptionProps {
  options: Option[];
  currentOption?: Option;
  style?: React.CSSProperties;
}

export const ModuleOptions = ({ options, style, currentOption }: OptionProps) => {
  const Options = useMemo(() => {
    return options.map((option, index) => {
      const { optionName, onClick } = option;
      
      return (
        <div key={index} onClick={() => {optionName; onClick();}}>
          <CapsuleButton $active={optionName === currentOption?.optionName}>{optionName}</CapsuleButton>
        </div>
      );
    });
  }, [options]);

  return <Container style={style}>
            {Options}
          </Container>;
};
