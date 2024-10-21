import {
  OptionValue,
  SliderContainer,
  SliderHelpLink,
  SliderHelpLinkText,
  SliderThumb,
  SliderTrack,
  ValueContainer,
} from "./style";

interface SliderProps<T> {
  options: T[];
  value?: T | null;
  selectable: boolean;
  helpLink: string;
}

export const Slider = <T extends string | number>({
  options,
  value,
  selectable,
  helpLink,
}: SliderProps<T>) => {
  const intervals = options.map((_, index) => (index * 100) / options.length);
  const leftPercentageValue = intervals[options.indexOf(value as T)];

  console.log("intervals", intervals);
  console.log("leftPercentageValue", leftPercentageValue);

  const optionsList = options.map((option, index) => {
    return (
      <OptionValue $selected={option === value} key={index}>
        {option}
      </OptionValue>
    );
  });

  return (
    <SliderContainer>
      <SliderTrack>
        <SliderThumb $Left={leftPercentageValue + "%"} />
      </SliderTrack>
      <ValueContainer>{optionsList}</ValueContainer>
      <SliderHelpLink href={helpLink}>
        <SliderHelpLinkText>What do these values mean?</SliderHelpLinkText>
      </SliderHelpLink>
    </SliderContainer>
  );
};
