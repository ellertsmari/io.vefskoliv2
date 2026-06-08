import styled from "styled-components";

export const TaskCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

export const Option = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
`;

export const OptionInput = styled.input`
  width: 1rem;
  height: 1rem;
  cursor: pointer;
`;

export const ResultBanner = styled.div<{ $passed: boolean }>`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 600;
  color: ${({ $passed }) => ($passed ? "#0f5132" : "#842029")};
  background-color: ${({ $passed }) => ($passed ? "#d1e7dd" : "#f8d7da")};
`;

export const TaskResultNote = styled.p<{ $correct: boolean }>`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ $correct }) => ($correct ? "#0f5132" : "#842029")};
`;
