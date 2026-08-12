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

export const CodeEditor = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  tab-size: 2;

  &:disabled {
    opacity: 0.6;
  }
`;

export const TestList = styled.ul`
  list-style: none;
  margin: 0.5rem 0 0 0;
  padding: 0;
  font-size: 0.85rem;
`;

export const TestRow = styled.li<{ $passed?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.25rem 0;
  color: ${({ $passed }) =>
    $passed === undefined ? "inherit" : $passed ? "#0f5132" : "#842029"};
`;

export const TestName = styled.span`
  font-weight: 600;
  white-space: nowrap;
`;

export const TestDetail = styled.code`
  opacity: 0.8;
  word-break: break-word;
`;

export const ErrorBox = styled.div`
  margin-top: 0.5rem;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  background: #fff3cd;
  color: #664d03;
  font-size: 0.85rem;
`;

export const ErrorSummary = styled.p`
  margin: 0;
  font-weight: 600;
`;

export const ErrorDetail = styled.code`
  display: block;
  margin-top: 0.25rem;
  word-break: break-word;
`;

export const TypeErrorList = styled.ul`
  margin: 0.35rem 0 0 1rem;
  padding: 0;
`;

export const ShortAnswerInput = styled.input`
  width: 100%;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  font: inherit;
  background: transparent;

  &:disabled {
    opacity: 0.6;
  }
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
