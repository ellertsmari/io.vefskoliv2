"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { submitExercise } from "serverActions/submitExercise";
import type { TaskResult } from "utils/exerciseUtils";
import { ExercisePublic } from "types/guideTypes";
import { Button } from "globalStyles/buttons/default/style";
import { Heading1, SubHeading1 } from "globalStyles/text";
import { Border, Wrapper } from "globalStyles/globalStyles";
import {
  TaskCard,
  TaskPrompt,
  TaskMeta,
  ExerciseMeta,
  Option,
  OptionInput,
  ResultBanner,
  TaskResultNote,
  SubmitRow,
  AnsweredCount,
} from "./style";

type Answers = Record<string, number[]>;

/** Fisher–Yates shuffle of [0..n), used for per-mount option display order. */
const shuffledIndices = (n: number): number[] => {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

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

  // Tasks whose answer changed AFTER the last grading — their old
  // Correct/Incorrect note is stale and must not be shown.
  const [changedSinceResult, setChangedSinceResult] = useState<Set<string>>(
    new Set()
  );

  // Per-task display order of options. Shuffled once per mount, AFTER
  // hydration (shuffling during render would mismatch the server-rendered
  // HTML). Selections always store the ORIGINAL option indices, so grading
  // is unaffected. Until the effect runs, options render in natural order.
  const [optionOrder, setOptionOrder] = useState<Record<string, number[]>>({});
  useEffect(() => {
    const order: Record<string, number[]> = {};
    for (const task of exercise.tasks) {
      order[task.id] = shuffledIndices(task.options.length);
    }
    setOptionOrder(order);
  }, [exercise.tasks]);

  const result = state?.success ? state.data : undefined;
  const errorMessage = state && !state.success ? state.message : undefined;

  // A fresh grading result supersedes any "changed since result" tracking.
  useEffect(() => {
    if (state) setChangedSinceResult(new Set());
  }, [state]);

  // Bring the result banner into view and let screen readers announce it.
  const bannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (result || errorMessage) {
      bannerRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [result, errorMessage]);

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
    // Once graded, changing an answer invalidates that task's feedback note.
    if (result) {
      setChangedSinceResult((prev) => {
        const next = new Set(prev);
        next.add(taskId);
        return next;
      });
    }
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

  const answeredCount = exercise.tasks.filter(
    (task) => (answers[task.id] ?? []).length > 0
  ).length;
  const allAnswered = answeredCount === exercise.tasks.length;

  const taskCount = exercise.tasks.length;
  const passPercent = Math.round(exercise.passThreshold * 100);

  return (
    <Wrapper>
      <Heading1>Exercise</Heading1>
      <ExerciseMeta>
        {taskCount} question{taskCount === 1 ? "" : "s"} · {passPercent}% to
        pass · unlimited attempts — your best score counts
      </ExerciseMeta>

      <div ref={bannerRef} aria-live="polite">
        {result && (
          <ResultBanner $passed={result.passed}>
            {result.passed ? "Passed" : "Not passed yet"} — score{" "}
            {result.score}/10 ({result.earnedPoints}/{result.totalPoints}{" "}
            points)
            {!result.passed && " — adjust your answers and try again."}
          </ResultBanner>
        )}
        {errorMessage && (
          <ResultBanner $passed={false}>{errorMessage}</ResultBanner>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {exercise.tasks.map((task, taskIndex) => {
          const isStale = changedSinceResult.has(task.id);
          const taskResult = isStale ? undefined : resultByTask[task.id];
          const selected = answers[task.id] ?? [];
          const displayOrder =
            optionOrder[task.id] ??
            task.options.map((_, originalIndex) => originalIndex);
          return (
            <TaskCard key={task.id}>
              <TaskPrompt>
                <SubHeading1>
                  {taskIndex + 1}. {task.prompt}
                </SubHeading1>
              </TaskPrompt>
              <TaskMeta>
                {task.allowMultiple ? "Select all that apply" : "Choose one"}
              </TaskMeta>
              <Border>
                {displayOrder.map((originalIndex) => (
                  <Option key={originalIndex}>
                    <OptionInput
                      type={task.allowMultiple ? "checkbox" : "radio"}
                      name={task.id}
                      checked={selected.includes(originalIndex)}
                      disabled={isPending}
                      onChange={() =>
                        toggleOption(task.id, originalIndex, task.allowMultiple)
                      }
                    />
                    <span>{task.options[originalIndex]}</span>
                  </Option>
                ))}
              </Border>
              {taskResult && (
                <TaskResultNote $correct={taskResult.correct}>
                  {taskResult.correct
                    ? `Correct${
                        taskResult.explanation
                          ? ` — ${taskResult.explanation}`
                          : ""
                      }`
                    : `Not quite — ${
                        taskResult.hint ??
                        "review the materials above and try again."
                      }`}
                </TaskResultNote>
              )}
            </TaskCard>
          );
        })}

        <SubmitRow>
          <Button
            type="submit"
            $styletype="default"
            disabled={isPending || !allAnswered}
          >
            {isPending ? "Submitting…" : result ? "Submit again" : "Submit"}
          </Button>
          {!allAnswered && (
            <AnsweredCount>
              {answeredCount} of {taskCount} answered
            </AnsweredCount>
          )}
        </SubmitRow>
      </form>
    </Wrapper>
  );
};
