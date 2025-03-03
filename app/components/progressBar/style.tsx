"use client";

import styled from "styled-components";

export const ProgressContainer = styled.div`
  display: flex;
  flex-direction: row; /* Aligns items in a row */
  justify-content: space-between; /* Distributes the bars evenly */
  align-items: center; /* Aligns bars vertically */
  width: 100%;
`;

export const LabelContainer = styled.div`
  display: flex;
  justify-content: space-between;
  text-align: left;
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 1px;
`;

export const OvalsContainer = styled.div`
  display: flex;
  gap: 3px; /*space between oval forms */
`;

export const Oval = styled.div<{ $filled: boolean }>`
  width: 20px;
  height: 40px;
  background-color: ${({ $filled }) => ($filled ? "#2B5B76" : "#D9D9D9")};
  border-radius: 50px; /* oval form */
  transition: background-color 0.3s ease-in-out;
`;

// Container for each progress bar and percentage
export const ProgressWrapper = styled.div`
  font-size: 14px;
  font-weight: normal;
  color: #2b5b76;
  display: flex;
  flex-direction: column; /* Stack label, progress bar, and percentage */
  align-items: flex-start; /* Align content to the left */
  gap: 5px; /* Space between elements */
`;

// Style to display the percentage
export const Percentage = styled.span`
  font-size: 14px;
  font-weight: normal;
  color: #2b5b76;
`;

export const Progress = styled.div`
  display: flex;
  align-items: center; /* Aligns progress bar and percentage in one row */
  gap: 10px; /* Space between progress bar and percentage */
  width: 100%;
  justify-content: space-between;
`;

export const Title = styled.h2`
  font-size: 18px;
  font-weight: normal;
  color: #2b5b76;
  text-align: left;
  width: 100%;
  max-width: 1250px; /* Matches BoxContainer width */
  margin-bottom: 5px;

  @media (max-width: 768px) {
    font-size: 16px;
    text-align: center;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    text-align: center;
  }
`;

export const BoxContainer = styled.div`
  width: 100%;
  max-width: 1250px; /* Matches Title width */
  min-height: 110px;
  border: 1px solid #e8f1fc;
  border-radius: 8px;
  padding: 20px 10px;
  background-color: #ffffff;
  margin: 10px 0; /* Adjusts spacing */
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center; /* Centers the title and box */
  width: 100%;
`;
