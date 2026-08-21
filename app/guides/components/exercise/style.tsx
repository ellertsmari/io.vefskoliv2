import styled, { css } from "styled-components";

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
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--primary-black-60);
`;

export const ExerciseMeta = styled.p`
  margin: 0 0 1rem 0;
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

export const SubmitRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const AnsweredCount = styled.span`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
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

/**
 * The highlight layer and the textarea are stacked, so every rule that affects
 * where a character lands has to be identical in both. Changing one of these
 * without the other makes the colours drift away from the text as it is typed.
 */
const editorBox = css`
  margin: 0;
  padding: 0.75rem 1rem;
  border: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-sm);
  line-height: 1.5;
  tab-size: 2;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: break-word;
`;

export const EditorWrap = styled.div`
  position: relative;
  width: 100%;
  border-radius: var(--radius-md);
  background: #1e1e2a;
  overflow: hidden;
`;

export const EditorHighlight = styled.pre`
  ${editorBox};
  position: absolute;
  inset: 0;
  overflow: auto;
  pointer-events: none;
  color: #e6e6ef;

  .tok-comment {
    color: #7c8296;
    font-style: italic;
  }
  .tok-string,
  .tok-template {
    color: #b6e29a;
  }
  .tok-number {
    color: #f2b880;
  }
  .tok-keyword {
    color: #c792ea;
  }
  .tok-type {
    color: #82c8f0;
  }
`;

export const EditorTextArea = styled.textarea`
  ${editorBox};
  position: relative;
  display: block;
  width: 100%;
  resize: vertical;
  min-height: 12rem;
  background: transparent;
  /* The text itself is invisible: the layer behind supplies the colours. The
     caret and the selection must stay visible or the box is unusable. */
  color: transparent;
  caret-color: var(--primary-white);
  outline: none;

  &::selection {
    background: rgba(101, 99, 235, 0.45);
  }

  &:disabled {
    opacity: 0.6;
  }
`;

export const TestList = styled.ul`
  list-style: none;
  margin: 0.5rem 0 0 0;
  padding: 0;
  font-size: var(--text-sm);
`;

export const TestRow = styled.li<{ $passed?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.25rem 0;
  color: ${({ $passed }) =>
    $passed === undefined ? "inherit" : $passed ? "var(--primary-black-100)" : "var(--primary-black-100)"};
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
  border-radius: var(--radius-md);
  background: var(--error-warning-30);
  color: var(--primary-black-100);
  font-size: var(--text-sm);
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
  border-radius: var(--radius-md);
  font: inherit;
  background: transparent;

  &:disabled {
    opacity: 0.6;
  }
`;

export const ResultBanner = styled.div<{ $passed: boolean }>`
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1rem;
  font-weight: 600;
  color: ${({ $passed }) => ($passed ? "var(--primary-black-100)" : "var(--primary-black-100)")};
  background-color: ${({ $passed }) => ($passed ? "var(--error-success-30)" : "var(--error-failure-30)")};
`;

export const TaskResultNote = styled.p<{
  $correct: boolean;
  $partial?: boolean;
}>`
  margin: 0;
  font-size: var(--text-sm);
  color: ${({ $correct, $partial }) =>
    $correct ? "var(--primary-black-100)" : $partial ? "var(--primary-black-100)" : "var(--primary-black-100)"};
`;

export const GoalBreakdownList = styled.ul`
  list-style: none;
  margin: 0 0 1rem 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const GoalItem = styled.li<{ $mastered: boolean }>`
  font-size: var(--text-sm);
  color: ${({ $mastered }) => ($mastered ? "var(--primary-black-100)" : "var(--primary-black-100)")};
`;
