import React from "react";
import { ProgressContainer, LabelContainer, OvalsContainer, Oval, Wrapper, Title, BoxContainer } from "./style";

interface ProgressBarProps {
  label?: string;
  progress?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, progress = 0 }) => {
  // Progress between 0 and 100
  const totalOvals = 20;
  const filledOvals = Math.round((progress / 100) * totalOvals);

  return (
    <ProgressContainer>
      <LabelContainer>
        <span>{label}</span>
      </LabelContainer>
      <OvalsContainer>
        {Array.from({ length: totalOvals }).map((_, index) => (
          <Oval key={index} filled={index < filledOvals} />
        ))}
      </OvalsContainer>
    </ProgressContainer>
  );
};

export default ProgressBar;
