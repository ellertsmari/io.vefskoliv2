import { useEffect, useState, useMemo } from "react";
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
  titles?: string[];
  value?: T | null;
  selectable: boolean;
  helpLink: string;
  handleOnChange?: (newValue: T) => void;
}

export const Slider = <T extends string | number>({
  options,
  value,
  handleOnChange,
  titles,
  selectable,
  helpLink,
  id,
}: SliderProps<T>) => {
  if (titles && titles.length !== options.length)
    throw new Error("Titles must be the same length as options");

  const [tempValue, setTempValue] = useState<T | null | undefined>(value);

  useEffect(() => {
    if (handleOnChange && tempValue) handleOnChange(tempValue);
  }, [tempValue]);

  const optionsList = useMemo(
    () =>
      options.map((option, index) => {
        console.log("option", option, "titles[index]", titles && titles[index]);
        return (
          <OptionValue
            $selected={option === tempValue}
            key={index}
            htmlFor={`${id}-option-${option}`}
            onClick={selectable ? () => setTempValue(option) : undefined}
            title={titles && titles[index]}
          >
            {option}
          </OptionValue>
        );
      }),
    [options, tempValue, selectable]
  );

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
