import React from "react";
import styled from "styled-components";

const ProgressContainer = styled.div`
  width: 100%;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${(props) => props.progress}%;
  background-color: #4caf50;
  transition: width 0.3s ease-in-out;
`;

export const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <ProgressContainer>
      <ProgressFill progress={progress} />
    </ProgressContainer>
  );
};
