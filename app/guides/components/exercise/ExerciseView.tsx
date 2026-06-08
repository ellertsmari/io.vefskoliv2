"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { submitExercise } from "serverActions/submitExercise";
import type { TaskResult } from "utils/exerciseUtils";
import { ExercisePublic } from "types/guideTypes";
import { Button } from "globalStyles/buttons/default/style";
import { Heading1, Paragraph, SubHeading1 } from "globalStyles/text";
import { Border, Wrapper } from "globalStyles/globalStyles";
import {
  TaskCard,
  Option,
  OptionInput,
  ResultBanner,
  TaskResultNote,
} from "./style";

type Answers = Record<string, number[]>;

export const ExerciseView = ({
  guideId,
  exercise,
}: {
  guideId: string;
  exercise: ExercisePublic;
}) => {
  const [answers, setAnswers] = useState<Answers>({});
  const [state, formAction, isPending] = useActionState(
    submitExercise,
    undefined
  );

  const result = state?.success ? state.data : undefined;
  const errorMessage = state && !state.success ? state.message : undefined;

  // Map taskId -> result for quick lookup when rendering per-task feedback.
  const resultByTask = useMemo(() => {
    const map: Record<string, TaskResult> = {};
    result?.results.forEach((r) => {
      map[r.taskId] = r;
    });
    return map;
  }, [result]);

  const toggleOption = (
    taskId: string,
    optionIndex: number,
    allowMultiple: boolean
  ) => {
    setAnswers((prev) => {
      const current = prev[taskId] ?? [];
      if (!allowMultiple) {
        return { ...prev, [taskId]: [optionIndex] };
      }
      const next = current.includes(optionIndex)
        ? current.filter((i) => i !== optionIndex)
        : [...current, optionIndex];
      return { ...prev, [taskId]: next };
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      formAction({ guideId, answers });
    });
  };

  const allAnswered = exercise.tasks.every(
    (task) => (answers[task.id] ?? []).length > 0
  );

  return (
    <Wrapper>
      <Heading1>Exercise</Heading1>
      <Paragraph>
        Answer the questions below. Your submission is graded automatically.
      </Paragraph>

      {result && (
        <ResultBanner $passed={result.passed}>
          {result.passed ? "Passed" : "Not passed yet"} — score {result.score}/10
          {" "}({result.earnedPoints}/{result.totalPoints} points)
          {!result.passed && " — feel free to try again."}
        </ResultBanner>
      )}
      {errorMessage && <ResultBanner $passed={false}>{errorMessage}</ResultBanner>}

      <form onSubmit={handleSubmit}>
        {exercise.tasks.map((task, taskIndex) => {
          const taskResult = resultByTask[task.id];
          const selected = answers[task.id] ?? [];
          return (
            <TaskCard key={task.id}>
              <SubHeading1>
                {taskIndex + 1}. {task.prompt}
              </SubHeading1>
              <Border>
                {task.options.map((optionText, optionIndex) => (
                  <Option key={optionIndex}>
                    <OptionInput
                      type={task.allowMultiple ? "checkbox" : "radio"}
                      name={task.id}
                      checked={selected.includes(optionIndex)}
                      disabled={isPending}
                      onChange={() =>
                        toggleOption(
                          task.id,
                          optionIndex,
                          task.allowMultiple
                        )
                      }
                    />
                    <span>{optionText}</span>
                  </Option>
                ))}
              </Border>
              {taskResult && (
                <TaskResultNote $correct={taskResult.correct}>
                  {taskResult.correct ? "Correct" : "Incorrect"}
                  {taskResult.explanation ? ` — ${taskResult.explanation}` : ""}
                </TaskResultNote>
              )}
            </TaskCard>
          );
        })}

        <Button
          type="submit"
          $styletype="default"
          disabled={isPending || !allAnswered}
        >
          {isPending ? "Submitting…" : result ? "Submit again" : "Submit"}
        </Button>
      </form>
    </Wrapper>
  );
};
