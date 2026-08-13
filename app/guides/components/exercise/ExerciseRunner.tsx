"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  startExercise,
  checkAnswer,
  skipTask,
  finishExercise,
  getExerciseSummary,
  type CheckedAnswer,
  type ExerciseSummary,
  type FinishedExercise,
  type StartedExercise,
} from "serverActions/exerciseSession";
import {
  ExerciseTaskType,
  MAX_CODE_LENGTH,
  type ExerciseAnswerValue,
  type ExercisePublic,
  type ExerciseTaskPublic,
} from "types/guideTypes";
import type { ExerciseProgress } from "utils/exerciseUtils";
import { MAX_ANSWER_LENGTH } from "utils/shortAnswer";
import { Button } from "globalStyles/buttons/default/style";
import { Border } from "globalStyles/globalStyles";
import { CodeTaskFields, CodeFeedbackView } from "./CodeTask";
import {
  Option,
  OptionInput,
  ShortAnswerInput,
  TaskMeta,
} from "./style";
import {
  ProgressTrack,
  ProgressFill,
  ProgressLabel,
  Trophy,
  PerfectBanner,
  PerfectText,
} from "./launcherStyle";
import {
  RunnerShell,
  RunnerHeader,
  RunnerBody,
  RunnerFooter,
  Prompt,
  Feedback,
  Spacer,
  GoalList,
  GoalRow,
  ScoreBig,
} from "./runnerStyle";

/**
 * The exercise, one question at a time.
 *
 * A correct answer moves the student on; a wrong one keeps them on the
 * question, because being told the answer teaches less than finding it. Short
 * answers move on after three tries — unlike a quiz you cannot narrow those
 * down by elimination, and the count is shown so it is never a surprise. Skip
 * is always available: being stuck with no way forward is worse than the wall
 * of questions this replaced.
 *
 * Every answer is checked on the SERVER. The answer key never reaches the
 * browser, and first-try accuracy — which is the grade — is recorded there too.
 */

const AUTO_ADVANCE_MS = 1200;

type Phase = "loading" | "running" | "finished" | "error";

const isResolved = (progress: ExerciseProgress, id: string) =>
  !!(progress[id]?.correct || progress[id]?.skipped);

export const ExerciseRunner = ({
  guideId,
  onClose,
  onSummaryChange,
}: {
  guideId: string;
  onClose: () => void;
  onSummaryChange?: (summary: ExerciseSummary) => void;
}) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [started, setStarted] = useState<StartedExercise | null>(null);
  const [progress, setProgress] = useState<ExerciseProgress>({});
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<ExerciseAnswerValue>([]);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<CheckedAnswer | null>(null);
  const [result, setResult] = useState<FinishedExercise | null>(null);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);

  const exercise: ExercisePublic | null = started?.exercise ?? null;
  const tasks = exercise?.tasks ?? [];
  const task: ExerciseTaskPublic | undefined = tasks[index];

  const resolvedCount = tasks.filter((t) => isResolved(progress, t.id)).length;

  // ---- open -------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await startExercise(guideId);
      if (cancelled) return;
      if (!res.success) {
        setErrorMessage(res.message);
        setPhase("error");
        return;
      }
      setStarted(res.data);
      setProgress(res.data.progress);
      // Resume at the first question that is not already resolved.
      const firstOpen = res.data.exercise.tasks.findIndex(
        (t) => !isResolved(res.data.progress, t.id)
      );
      setIndex(firstOpen === -1 ? 0 : firstOpen);
      setPhase("running");
    })();
    return () => {
      cancelled = true;
    };
  }, [guideId]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    []
  );

  // Reset the draft whenever the question changes, and move focus to it so a
  // keyboard user is not left at the top of the modal each time.
  useEffect(() => {
    setFeedback(null);
    if (!task) return;
    setDraft(
      task.type === ExerciseTaskType.CODE
        ? task.starterCode
        : task.type === ExerciseTaskType.SHORT_ANSWER
        ? ""
        : []
    );
    promptRef.current?.focus();
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- moving on --------------------------------------------------------

  const goToNextOpen = useCallback(
    (updated: ExerciseProgress) => {
      const next = tasks.findIndex(
        (t, i) => i > index && !isResolved(updated, t.id)
      );
      if (next !== -1) {
        setIndex(next);
        return;
      }
      // Nothing after this one — wrap to anything still open earlier.
      const earlier = tasks.findIndex((t) => !isResolved(updated, t.id));
      if (earlier !== -1) {
        setIndex(earlier);
        return;
      }
      setIndex(tasks.length); // past the end: the finish screen
    },
    [tasks, index]
  );

  const scheduleAdvance = (updated: ExerciseProgress) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(
      () => goToNextOpen(updated),
      AUTO_ADVANCE_MS
    );
  };

  // ---- answering --------------------------------------------------------

  const hasDraft =
    task?.type === ExerciseTaskType.QUIZ
      ? Array.isArray(draft) && draft.length > 0
      : typeof draft === "string" && draft.trim().length > 0;

  const submitAnswer = async () => {
    if (!task || checking || !hasDraft) return;
    setChecking(true);
    const res = await checkAnswer({ guideId, taskId: task.id, answer: draft });
    setChecking(false);

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setFeedback(res.data);
    const updated: ExerciseProgress = {
      ...progress,
      [task.id]: {
        tries: (progress[task.id]?.tries ?? 0) + 1,
        correct: res.data.status === "correct",
        firstTryCorrect:
          res.data.status === "correct" && (progress[task.id]?.tries ?? 0) === 0,
        skipped: false,
      },
    };
    // A short answer that ran out of tries is done with, without being correct.
    if (res.data.advance && res.data.status !== "correct") {
      updated[task.id] = { ...updated[task.id], skipped: true };
    }
    setProgress(updated);

    if (res.data.advance) scheduleAdvance(updated);
  };

  const skipCurrent = async () => {
    if (!task || checking) return;
    setChecking(true);
    const res = await skipTask(guideId, task.id);
    setChecking(false);
    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }
    const updated: ExerciseProgress = {
      ...progress,
      [task.id]: {
        tries: progress[task.id]?.tries ?? 0,
        correct: false,
        firstTryCorrect: false,
        skipped: true,
      },
    };
    setProgress(updated);
    setFeedback(null);
    goToNextOpen(updated);
  };

  const finish = async () => {
    setChecking(true);
    const res = await finishExercise(guideId);
    setChecking(false);
    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }
    setResult(res.data);
    setPhase("finished");
    const summary = await getExerciseSummary(guideId);
    if (summary) onSummaryChange?.(summary);
  };

  // ---- render -----------------------------------------------------------

  if (phase === "loading") {
    return (
      <RunnerShell>
        <RunnerBody>
          <p>Opening the exercise…</p>
        </RunnerBody>
      </RunnerShell>
    );
  }

  if (phase === "error") {
    return (
      <RunnerShell>
        <RunnerBody>
          <Feedback $tone="wrong">{errorMessage}</Feedback>
        </RunnerBody>
        <RunnerFooter>
          <Button $styletype="default" type="button" onClick={onClose}>
            Close
          </Button>
        </RunnerFooter>
      </RunnerShell>
    );
  }

  if (phase === "finished" && result) {
    return (
      <RunnerShell>
        <RunnerBody>
          {result.perfect ? (
            <PerfectBanner>
              <Trophy role="img" aria-label="trophy" $animate>
                🏆
              </Trophy>
              <PerfectText>
                <strong>Perfect score</strong>
                <span>Every question right, first time. Well done.</span>
              </PerfectText>
            </PerfectBanner>
          ) : (
            <>
              <ScoreBig>{result.score}/10</ScoreBig>
              <TaskMeta>
                {result.passed ? "Passed" : "Not passed yet"} ·{" "}
                {result.earnedPoints} of {result.totalPoints} points, scored on
                first-try answers
              </TaskMeta>
            </>
          )}

          {result.goalBreakdown && result.goalBreakdown.length > 0 && (
            <GoalList aria-label="Score by learning goal">
              {result.goalBreakdown.map((g) => {
                const mastered = g.earnedPoints === g.totalPoints;
                return (
                  <GoalRow key={g.goal} $mastered={mastered}>
                    {mastered ? "✓" : "↻"} {g.goal} — {g.earnedPoints}/
                    {g.totalPoints}
                    {mastered ? "" : " · worth revisiting"}
                  </GoalRow>
                );
              })}
            </GoalList>
          )}
        </RunnerBody>
        <RunnerFooter>
          <Button $styletype="default" type="button" onClick={onClose}>
            Back to the guide
          </Button>
        </RunnerFooter>
      </RunnerShell>
    );
  }

  // Past the last open question: offer to finish.
  if (!task) {
    const skipped = tasks.filter((t) => progress[t.id]?.skipped);
    return (
      <RunnerShell>
        <RunnerHeader>
          <ProgressTrack
            role="progressbar"
            aria-valuenow={resolvedCount}
            aria-valuemin={0}
            aria-valuemax={tasks.length}
          >
            <ProgressFill $percent={100} $complete />
          </ProgressTrack>
          <ProgressLabel>All {tasks.length} questions answered</ProgressLabel>
        </RunnerHeader>
        <RunnerBody>
          <Prompt as="h2">Ready to finish?</Prompt>
          {skipped.length > 0 ? (
            <TaskMeta>
              {skipped.length} question{skipped.length === 1 ? " was" : "s were"}{" "}
              skipped and will score nothing. You can still go back to{" "}
              {skipped.length === 1 ? "it" : "them"}.
            </TaskMeta>
          ) : (
            <TaskMeta>
              Your score is how many you got right on the first try.
            </TaskMeta>
          )}
        </RunnerBody>
        <RunnerFooter>
          {skipped.length > 0 && (
            <Button
              $styletype="outlined"
              type="button"
              onClick={() => {
                const first = tasks.findIndex((t) => progress[t.id]?.skipped);
                const cleared = { ...progress };
                delete cleared[tasks[first].id];
                setProgress(cleared);
                setIndex(first);
              }}
            >
              Go back to a skipped question
            </Button>
          )}
          <Spacer />
          <Button
            $styletype="default"
            type="button"
            disabled={checking}
            onClick={finish}
          >
            {checking ? "Scoring…" : "Finish and see my score"}
          </Button>
        </RunnerFooter>
      </RunnerShell>
    );
  }

  const triesSoFar = progress[task.id]?.tries ?? 0;
  const isShortAnswer = task.type === ExerciseTaskType.SHORT_ANSWER;
  const showTriesLeft =
    isShortAnswer && started ? started.shortAnswerMaxTries - triesSoFar : null;

  return (
    <RunnerShell>
      <RunnerHeader>
        <ProgressTrack
          role="progressbar"
          aria-valuenow={resolvedCount}
          aria-valuemin={0}
          aria-valuemax={tasks.length}
          aria-label="Exercise progress"
        >
          <ProgressFill $percent={(resolvedCount / tasks.length) * 100} />
        </ProgressTrack>
        <ProgressLabel>
          Question {index + 1} of {tasks.length} · {resolvedCount} answered
        </ProgressLabel>
      </RunnerHeader>

      <RunnerBody>
        <Prompt ref={promptRef} tabIndex={-1}>
          {task.prompt}
        </Prompt>

        {task.type === ExerciseTaskType.QUIZ && (
          <>
            <TaskMeta>
              {task.allowMultiple ? "Select all that apply" : "Choose one"}
            </TaskMeta>
            <Border>
              {task.options.map((option, i) => (
                <Option key={i}>
                  <OptionInput
                    type={task.allowMultiple ? "checkbox" : "radio"}
                    name={task.id}
                    checked={Array.isArray(draft) && draft.includes(i)}
                    disabled={checking}
                    onChange={() =>
                      setDraft((prev) => {
                        const current = Array.isArray(prev) ? prev : [];
                        if (!task.allowMultiple) return [i];
                        return current.includes(i)
                          ? current.filter((x) => x !== i)
                          : [...current, i];
                      })
                    }
                  />
                  <span>{option}</span>
                </Option>
              ))}
            </Border>
          </>
        )}

        {isShortAnswer && (
          <>
            <TaskMeta>
              Type your answer
              {showTriesLeft !== null &&
                ` · ${showTriesLeft} ${
                  showTriesLeft === 1 ? "try" : "tries"
                } left before it moves on`}
            </TaskMeta>
            <Border>
              <ShortAnswerInput
                type="text"
                autoFocus
                value={typeof draft === "string" ? draft : ""}
                placeholder={task.placeholder ?? ""}
                disabled={checking}
                maxLength={MAX_ANSWER_LENGTH}
                aria-label={task.prompt}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void submitAnswer();
                  }
                }}
              />
            </Border>
          </>
        )}

        {task.type === ExerciseTaskType.CODE && (
          <CodeTaskFields
            task={task}
            value={typeof draft === "string" ? draft : task.starterCode}
            disabled={checking}
            onChange={(text) => setDraft(text.slice(0, MAX_CODE_LENGTH))}
          />
        )}

        <div aria-live="polite">
          {feedback && (
            <Feedback
              $tone={feedback.status === "correct" ? "right" : "wrong"}
            >
              {feedback.status === "correct"
                ? `Correct${
                    feedback.explanation ? ` — ${feedback.explanation}` : ""
                  }`
                : feedback.advance
                ? "That's the last try — moving on. This one scores nothing."
                : `Not quite${feedback.hint ? ` — ${feedback.hint}` : ""}`}
            </Feedback>
          )}
          {feedback?.code && <CodeFeedbackView feedback={feedback.code} />}
        </div>
      </RunnerBody>

      <RunnerFooter>
        <Button
          $styletype="outlined"
          type="button"
          disabled={checking}
          onClick={skipCurrent}
        >
          Skip
        </Button>
        <Spacer />
        {feedback?.advance ? (
          <Button
            $styletype="default"
            type="button"
            onClick={() => {
              if (advanceTimer.current) clearTimeout(advanceTimer.current);
              goToNextOpen(progress);
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            $styletype="default"
            type="button"
            disabled={checking || !hasDraft}
            onClick={submitAnswer}
          >
            {checking
              ? task.type === ExerciseTaskType.CODE
                ? "Running your code…"
                : "Checking…"
              : "Check"}
          </Button>
        )}
      </RunnerFooter>
    </RunnerShell>
  );
};
