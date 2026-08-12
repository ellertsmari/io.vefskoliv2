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
import type { BestAttemptInfo } from "serverActions/getExerciseAttempts";
import type { TaskResult } from "utils/exerciseUtils";
import { MAX_ANSWER_LENGTH } from "utils/shortAnswer";
import {
  ExercisePublic,
  ExerciseTaskPublic,
  ExerciseTaskType,
  type ExerciseAnswerValue,
} from "types/guideTypes";
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
  ShortAnswerInput,
  ResultBanner,
  TaskResultNote,
  SubmitRow,
  AnsweredCount,
  GoalBreakdownList,
  GoalItem,
} from "./style";
import { CodeTaskFields, CodeFeedbackView } from "./CodeTask";

type Answers = Record<string, ExerciseAnswerValue>;

/** Has the student put anything in this task yet? Shape depends on the type. */
const isAnswered = (task: ExerciseTaskPublic, answer?: ExerciseAnswerValue) => {
  if (task.type === ExerciseTaskType.QUIZ) {
    return Array.isArray(answer) && answer.length > 0;
  }
  return typeof answer === "string" && answer.trim().length > 0;
};

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
  bestAttempt,
}: {
  guideId: string;
  exercise: ExercisePublic;
  /** the student's best previous attempt, for "your best so far" context */
  bestAttempt?: BestAttemptInfo;
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
      if (task.type === ExerciseTaskType.QUIZ) {
        order[task.id] = shuffledIndices(task.options.length);
      }
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

  // Once graded, changing an answer invalidates that task's feedback note.
  const markChanged = (taskId: string) => {
    if (!result) return;
    setChangedSinceResult((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
  };

  const toggleOption = (
    taskId: string,
    optionIndex: number,
    allowMultiple: boolean
  ) => {
    markChanged(taskId);
    setAnswers((prev) => {
      const current = (prev[taskId] as number[]) ?? [];
      if (!allowMultiple) {
        return { ...prev, [taskId]: [optionIndex] };
      }
      const next = current.includes(optionIndex)
        ? current.filter((i) => i !== optionIndex)
        : [...current, optionIndex];
      return { ...prev, [taskId]: next };
    });
  };

  const setTextAnswer = (taskId: string, text: string) => {
    markChanged(taskId);
    setAnswers((prev) => ({ ...prev, [taskId]: text }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      formAction({ guideId, answers });
    });
  };

  const answeredCount = exercise.tasks.filter((task) =>
    isAnswered(task, answers[task.id])
  ).length;
  const allAnswered = answeredCount === exercise.tasks.length;

  const taskCount = exercise.tasks.length;
  const passPercent = Math.round(exercise.passThreshold * 100);

  return (
    <Wrapper>
      <Heading1>Exercise</Heading1>
      <ExerciseMeta>
        {taskCount} question{taskCount === 1 ? "" : "s"}
        {exercise.poolTotal
          ? ` (drawn from a pool of ${exercise.poolTotal})`
          : ""}{" "}
        · {passPercent}% to pass · unlimited attempts — your best score counts
      </ExerciseMeta>
      {bestAttempt && !result && (
        <ExerciseMeta>
          Your best so far: <strong>{bestAttempt.score}/10</strong>{" "}
          {bestAttempt.passed ? "(passed)" : "(not passed yet)"} ·{" "}
          {bestAttempt.attemptCount} attempt
          {bestAttempt.attemptCount === 1 ? "" : "s"}
          {bestAttempt.passed && " — retake to improve your score"}
        </ExerciseMeta>
      )}

      <div ref={bannerRef} aria-live="polite">
        {result && (
          <ResultBanner $passed={result.passed}>
            {result.passed
              ? "Passed"
              : result.pendingCount > 0
              ? "Awaiting review"
              : "Not passed yet"}{" "}
            — score {result.score}/10 ({result.earnedPoints}/
            {result.totalPoints} points)
            {result.pendingCount > 0
              ? ` — ${result.pendingCount} answer${
                  result.pendingCount === 1 ? " is" : "s are"
                } with your teacher. This score can only go up.`
              : !result.passed
              ? " — adjust your answers and try again."
              : ""}
          </ResultBanner>
        )}
        {errorMessage && (
          <ResultBanner $passed={false}>{errorMessage}</ResultBanner>
        )}
        {result?.goalBreakdown && result.goalBreakdown.length > 0 && (
          <GoalBreakdownList aria-label="Score by learning goal">
            {result.goalBreakdown.map(({ goal, earnedPoints, totalPoints }) => {
              const mastered = earnedPoints === totalPoints;
              return (
                <GoalItem key={goal} $mastered={mastered}>
                  {mastered ? "✓" : "↻"} {goal} — {earnedPoints}/{totalPoints}{" "}
                  points{mastered ? "" : " · worth revisiting in the materials"}
                </GoalItem>
              );
            })}
          </GoalBreakdownList>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {exercise.tasks.map((task, taskIndex) => {
          const isStale = changedSinceResult.has(task.id);
          const taskResult = isStale ? undefined : resultByTask[task.id];
          const answer = answers[task.id];
          return (
            <TaskCard key={task.id}>
              <TaskPrompt>
                <SubHeading1>
                  {taskIndex + 1}. {task.prompt}
                </SubHeading1>
              </TaskPrompt>

              {task.type === ExerciseTaskType.QUIZ ? (
                <>
                  <TaskMeta>
                    {task.allowMultiple
                      ? "Select all that apply · partial credit"
                      : "Choose one"}
                  </TaskMeta>
                  <Border>
                    {(
                      optionOrder[task.id] ??
                      task.options.map((_, originalIndex) => originalIndex)
                    ).map((originalIndex) => (
                      <Option key={originalIndex}>
                        <OptionInput
                          type={task.allowMultiple ? "checkbox" : "radio"}
                          name={task.id}
                          checked={
                            Array.isArray(answer) &&
                            answer.includes(originalIndex)
                          }
                          disabled={isPending}
                          onChange={() =>
                            toggleOption(
                              task.id,
                              originalIndex,
                              task.allowMultiple
                            )
                          }
                        />
                        <span>{task.options[originalIndex]}</span>
                      </Option>
                    ))}
                  </Border>
                </>
              ) : task.type === ExerciseTaskType.SHORT_ANSWER ? (
                <>
                  <TaskMeta>Type your answer</TaskMeta>
                  <Border>
                    <ShortAnswerInput
                      type="text"
                      value={typeof answer === "string" ? answer : ""}
                      placeholder={task.placeholder ?? ""}
                      disabled={isPending}
                      maxLength={MAX_ANSWER_LENGTH}
                      aria-label={task.prompt}
                      onChange={(e) => setTextAnswer(task.id, e.target.value)}
                    />
                  </Border>
                </>
              ) : (
                <CodeTaskFields
                  task={task}
                  value={
                    typeof answer === "string" ? answer : task.starterCode
                  }
                  disabled={isPending}
                  onChange={(text) => setTextAnswer(task.id, text)}
                />
              )}

              {taskResult && (
                <TaskResultNote
                  $correct={taskResult.correct}
                  $partial={
                    taskResult.status === "pending" ||
                    (!taskResult.correct && taskResult.pointsEarned > 0)
                  }
                >
                  {taskResult.status === "correct"
                    ? `Correct${
                        taskResult.explanation
                          ? ` — ${taskResult.explanation}`
                          : ""
                      }`
                    : taskResult.status === "pending"
                    ? "Close — your teacher is checking this one. It scores nothing for now, and your score can only go up if it is accepted."
                    : taskResult.pointsEarned > 0
                    ? `Partially correct (${taskResult.pointsEarned}/${
                        taskResult.pointsPossible
                      } points) — ${
                        taskResult.hint ??
                        "review the materials above and try again."
                      }`
                    : `Not quite — ${
                        taskResult.hint ??
                        "review the materials above and try again."
                      }`}
                </TaskResultNote>
              )}

              {taskResult?.code && (
                <CodeFeedbackView feedback={taskResult.code} />
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
