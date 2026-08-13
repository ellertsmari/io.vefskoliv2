"use client";

import {
  CodeConstruct,
  CONSTRUCT_LABELS,
  MAX_CODE_LENGTH,
  type CodeFeedback,
  type CodeTaskPublic,
} from "types/guideTypes";
import { Border } from "globalStyles/globalStyles";
import {
  TaskMeta,
  CodeEditor,
  TestList,
  TestRow,
  TestName,
  TestDetail,
  ErrorBox,
  ErrorSummary,
  ErrorDetail,
  TypeErrorList,
} from "./style";


/** The editor plus the test cases the student is allowed to see. */
export const CodeTaskFields = ({
  task,
  value,
  disabled,
  onChange,
}: {
  task: CodeTaskPublic;
  value: string;
  disabled: boolean;
  onChange: (text: string) => void;
}) => {
  const hiddenCount = task.tests.filter((t) => t.hidden).length;

  return (
    <>
      <TaskMeta>
        Write <code>{task.entryPoint}</code> — {task.tests.length} test
        {task.tests.length === 1 ? "" : "s"}
        {hiddenCount > 0 &&
          `, ${hiddenCount} of them hidden so your solution has to work in general`}
        {task.requires.length > 0 && (
          <>
            {" "}
            · expected to use{" "}
            {task.requires.map((c) => CONSTRUCT_LABELS[c]).join(", ")}
          </>
        )}
      </TaskMeta>

      <Border>
        <CodeEditor
          value={value}
          disabled={disabled}
          maxLength={MAX_CODE_LENGTH}
          spellCheck={false}
          rows={12}
          aria-label={`Your code for ${task.entryPoint}`}
          onChange={(e) => onChange(e.target.value)}
        />
      </Border>

      <TestList>
        {task.tests.map((test) => (
          <TestRow key={test.label}>
            <TestName>{test.label}</TestName>
            {test.hidden ? (
              <TestDetail>hidden</TestDetail>
            ) : (
              <TestDetail>
                {task.entryPoint}({test.args?.replace(/^\[|\]$/g, "")}) →{" "}
                {test.expected}
              </TestDetail>
            )}
          </TestRow>
        ))}
      </TestList>
    </>
  );
};

/** What came back after running: type errors, per-test outcomes, the error. */
export const CodeFeedbackView = ({ feedback }: { feedback: CodeFeedback }) => (
  <>
    {feedback.typeErrors.length > 0 && (
      <ErrorBox>
        <ErrorSummary>
          Your code did not compile, so the tests could not run.
        </ErrorSummary>
        <TypeErrorList>
          {feedback.typeErrors.map((e, i) => (
            <li key={i}>
              Line {e.line}: {e.message}
            </li>
          ))}
        </TypeErrorList>
      </ErrorBox>
    )}

    {feedback.runtimeError && (
      <ErrorBox>
        <ErrorSummary>{feedback.runtimeError.summary}</ErrorSummary>
        <ErrorDetail>
          {feedback.runtimeError.detail}
          {feedback.runtimeError.line !== undefined &&
            ` (line ${feedback.runtimeError.line} of your code)`}
        </ErrorDetail>
      </ErrorBox>
    )}

    {feedback.tests.length > 0 && (
      <TestList>
        {feedback.tests.map((test, i) => (
          <TestRow key={`${test.label}-${i}`} $passed={test.passed}>
            <TestName>
              {test.passed ? "✓" : "✕"} {test.label}
            </TestName>
            {!test.passed && !test.hidden && (
              <TestDetail>
                {test.error
                  ? test.error
                  : `expected ${test.expected}, got ${test.actual}`}
              </TestDetail>
            )}
            {!test.passed && test.hidden && <TestDetail>hidden</TestDetail>}
          </TestRow>
        ))}
      </TestList>
    )}

    {feedback.compiled && feedback.missingConstructs.length > 0 && (
      <TaskMeta>
        Your solution works, but this exercise is about{" "}
        {feedback.missingConstructs
          .map((c) => CONSTRUCT_LABELS[c])
          .join(", ")}{" "}
        — part of the marks are for using it.
      </TaskMeta>
    )}
  </>
);
