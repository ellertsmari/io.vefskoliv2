import styled from "styled-components";

export const TaskCard = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  border: none;
  padding: 0;
  margin-left: 0;
  margin-right: 0;
`;

export const TaskPrompt = styled.legend`
  padding: 0;
`;

export const TaskMeta = styled.span`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #666;
`;

export const ExerciseMeta = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #555;
`;

export const SubmitRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const AnsweredCount = styled.span`
  font-size: 0.9rem;
  color: #555;
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

export const TaskResultNote = styled.p<{
  $correct: boolean;
  $partial?: boolean;
}>`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ $correct, $partial }) =>
    $correct ? "#0f5132" : $partial ? "#664d03" : "#842029"};
`;

export const GoalBreakdownList = styled.ul`
  list-style: none;
  margin: 0 0 1rem 0;
  padding: 0.75rem 1rem;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const GoalItem = styled.li<{ $mastered: boolean }>`
  font-size: 0.9rem;
  color: ${({ $mastered }) => ($mastered ? "#0f5132" : "#664d03")};
`;
