"use client";
import { useMemo } from "react";
import { Container, CapsuleButton } from "./style";

export type Option = {
  optionName: string;
  onClick: () => void;
  /** Long form shown on hover, where the label itself is abbreviated. */
  description?: string;
};

interface OptionProps {
  options: Option[];
  currentOption?: Option;
  style?: React.CSSProperties;
  /** Names the group of pills for screen readers. */
  label?: string;
}

export const ModuleOptions = ({
  options,
  style,
  currentOption,
  label,
}: OptionProps) => {
  const Options = useMemo(() => {
    return options.map(({ optionName, onClick, description }) => {
      const isActive = optionName === currentOption?.optionName;

      return (
        // The click handler and the pressed state belong on the button itself.
        // Wrapping it in a clickable div meant the selected pill was invisible
        // to assistive tech and the div swallowed the semantics.
        <CapsuleButton
          key={optionName}
          type="button"
          $active={isActive}
          aria-pressed={isActive}
          title={description}
          onClick={onClick}
        >
          {optionName}
        </CapsuleButton>
      );
    });
  }, [options, currentOption]);

  return (
    <Container style={style} role="group" aria-label={label}>
      {Options}
    </Container>
  );
};
