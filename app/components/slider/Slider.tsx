import { use, useEffect, useState } from "react";
import {
  OptionValue,
  Container,
  SliderHelpLink,
  SliderHelpLinkText,
  SliderTrack,
  ValueContainer,
  SliderContainer,
} from "./style";

interface SliderProps<T> {
  id: string;
  options: T[];
  value?: T | null;
  selectable: boolean;
  helpLink: string;
  handleOnChange?: (newValue: T) => void;
}

export const Slider = <T extends string | number>({
  options,
  value,
  handleOnChange,
  selectable,
  helpLink,
  id,
}: SliderProps<T>) => {
  const [tempValue, setTempValue] = useState<T | null | undefined>(value);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && handleOnChange && tempValue) handleOnChange(tempValue);
  }, [tempValue]);

  const optionsList = options.map((option, index) => {
    return (
      <OptionValue
        $selected={option === tempValue}
        key={index}
        htmlFor={`${id}-option-${option}`}
        onClick={selectable ? () => setTempValue(option) : undefined}
      >
        {option}
      </OptionValue>
    );
  });

  const calculateSliderPercentage = () => {
    if (!tempValue) return 0;
    return (options.indexOf(tempValue) / (options.length - 1)) * 100;
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = options[parseInt(event.target.value)];
    setTempValue(newValue);
  };

  return (
    <Container>
      <SliderContainer>
        <SliderTrack
          type="range"
          max={options.length - 1}
          value={tempValue ? options.indexOf(tempValue) : 0}
          $selectable={selectable}
          disabled={!selectable}
          $sliderPercentage={calculateSliderPercentage()}
          onChange={handleSliderChange}
          id={id}
        />
      </SliderContainer>
      <ValueContainer>{optionsList}</ValueContainer>
      <SliderHelpLink href={helpLink} target="_blank" rel="noopener noreferrer">
        <SliderHelpLinkText>What do these values mean?</SliderHelpLinkText>
      </SliderHelpLink>
    </Container>
  );
};
