"use client";

import { useEffect, useRef, useState } from "react";
import { useFormDraft } from "utils/hooks/useStorage";
import { DraftNotice } from "UIcomponents/draftNotice/DraftNotice";
import {
  startExercise,
  checkAnswer,
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
import { Option, OptionInput, ShortAnswerInput, TaskMeta } from "./style";
import { Trophy, PerfectBanner, PerfectText, ProgressLabel } from "./launcherStyle";
import {
  RunnerShell,
  RunnerHeader,
  RunnerColumns,
  RunnerBody,
  HelpPanel,
  HelpHeading,
  HelpBody,
  HelpLinkList,
  HelpLinkItem,
  RunnerFooter,
  Prompt,
  Feedback,
  Spacer,
  GoalList,
  GoalRow,
  ScoreBig,
  SegmentBar,
  Segment,
  ConfirmNotice,
} from "./runnerStyle";

/**
 * The exercise, one question at a time, with free movement between them.
 *
 * Nothing advances on its own and nothing is locked: Previous and Next always
 * work, the segmented bar jumps straight to any question, and Check can be
 * pressed as many times as the student likes. A question left unanswered simply
 * earns nothing, which is what skipping already meant.
 *
 * Answers are checked on the SERVER. The key never reaches the browser, and
 * first-try accuracy — the grade — is recorded there rather than reported by
 * the client.
 */

type Phase = "loading" | "running" | "finished" | "error";

/** How a question looks in the progress bar. */
type SegmentState = "untried" | "correct" | "wrong";

const segmentState = (
  progress: ExerciseProgress,
  id: string
): SegmentState => {
  const entry = progress[id];
  if (entry?.correct) return "correct";
  if ((entry?.tries ?? 0) > 0) return "wrong";
  return "untried";
};

/**
 * Display order for a question's options, shuffled once per mount.
 *
 * Selections always store the ORIGINAL index, so grading is unaffected. Without
 * this the answer sits in the authored position every time, which makes "it is
 * usually the third one" learnable and lets two students compare positions
 * instead of reasoning.
 */
const shuffledIndices = (n: number): number[] => {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

const blankDraft = (task: ExerciseTaskPublic): ExerciseAnswerValue =>
  task.type === ExerciseTaskType.CODE
    ? task.starterCode
    : task.type === ExerciseTaskType.SHORT_ANSWER
    ? ""
    : [];

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
  const [drafts, setDrafts] = useState<Record<string, ExerciseAnswerValue>>({});
  // Unsent answers survive a reload or a closed tab, per attempt: a new
  // attempt draws different questions, so its drafts start empty.
  const savedDrafts = useFormDraft(
    started ? `exercise:${guideId}:${started.attemptNumber}` : null,
    drafts,
    setDrafts
  );
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, CheckedAnswer>>({});
  const [result, setResult] = useState<FinishedExercise | null>(null);
  const [confirmingFinish, setConfirmingFinish] = useState(false);

  const promptRef = useRef<HTMLHeadingElement>(null);
  const [optionOrder, setOptionOrder] = useState<Record<string, number[]>>({});

  const exercise: ExercisePublic | null = started?.exercise ?? null;
  const tasks = exercise?.tasks ?? [];
  const task: ExerciseTaskPublic | undefined = tasks[index];

  const correctCount = tasks.filter(
    (t) => segmentState(progress, t.id) === "correct"
  ).length;
  const untriedCount = tasks.filter(
    (t) => segmentState(progress, t.id) === "untried"
  ).length;

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
      const firstOpen = res.data.exercise.tasks.findIndex(
        (t) => !res.data.progress[t.id]?.correct
      );
      setIndex(firstOpen === -1 ? 0 : firstOpen);
      // Shuffled after load rather than during render: shuffling while
      // rendering would not match what the server sent.
      const order: Record<string, number[]> = {};
      for (const t of res.data.exercise.tasks) {
        if (t.type === ExerciseTaskType.QUIZ) {
          order[t.id] = shuffledIndices(t.options.length);
        }
      }
      setOptionOrder(order);
      setPhase("running");
    })();
    return () => {
      cancelled = true;
    };
  }, [guideId]);

  // Focus the question on each move, so a keyboard user lands on the content
  // rather than back at the top of the modal.
  useEffect(() => {
    promptRef.current?.focus();
  }, [index]);

  // ---- answering --------------------------------------------------------

  const draft = task
    ? drafts[task.id] ?? blankDraft(task)
    : ([] as ExerciseAnswerValue);

  const setDraft = (value: ExerciseAnswerValue) => {
    if (!task) return;
    setDrafts((prev) => ({ ...prev, [task.id]: value }));
  };

  const hasDraft =
    task?.type === ExerciseTaskType.QUIZ
      ? Array.isArray(draft) && draft.length > 0
      : typeof draft === "string" && draft.trim().length > 0;

  const current = task ? feedback[task.id] : undefined;
  const isCorrect = task ? !!progress[task.id]?.correct : false;

  const submitAnswer = async () => {
    if (!task || checking || !hasDraft || isCorrect) return;
    setChecking(true);
    const res = await checkAnswer({ guideId, taskId: task.id, answer: draft });
    setChecking(false);

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setFeedback((prev) => ({ ...prev, [task.id]: res.data }));
    setProgress((prev) => ({
      ...prev,
      [task.id]: {
        tries: res.data.tries,
        correct: res.data.status === "correct",
        firstTryCorrect:
          res.data.status === "correct" && res.data.tries === 1,
        skipped: false,
      },
    }));
  };

  const finish = async () => {
    setChecking(true);
    const res = await finishExercise(guideId);
    setChecking(false);
    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }
    savedDrafts.clear();
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

  if (!task) return null;

  /**
   * Finishing ends the attempt for good: the next one draws a different set of
   * questions, so there is no coming back to these. That is worth saying
   * plainly rather than discovering.
   */
  if (confirmingFinish) {
    return (
      <RunnerShell>
        <RunnerBody>
          <Prompt as="h2">Finish this attempt?</Prompt>
          <TaskMeta>
            {correctCount} of {tasks.length} correct so far.
          </TaskMeta>
          <ConfirmNotice>
            <strong>This attempt is scored and closed.</strong> You cannot come
            back to these questions — starting again gives you a different set
            drawn from the pool, and your best score is the one that counts.
            {untriedCount > 0 && (
              <>
                {" "}
                <strong>
                  {untriedCount} question{untriedCount === 1 ? "" : "s"} you have
                  not attempted
                </strong>{" "}
                will score nothing.
              </>
            )}
          </ConfirmNotice>
        </RunnerBody>
        <RunnerFooter>
          <Button
            $styletype="outlined"
            type="button"
            onClick={() => setConfirmingFinish(false)}
          >
            ← Keep working
          </Button>
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

  return (
    <RunnerShell>
      <RunnerHeader>
        <SegmentBar aria-label="Questions">
          {tasks.map((t, i) => {
            const state = segmentState(progress, t.id);
            return (
              <Segment
                key={t.id}
                type="button"
                $state={state}
                $current={i === index}
                aria-current={i === index ? "step" : undefined}
                aria-label={`Question ${i + 1}: ${
                  state === "correct"
                    ? "correct"
                    : state === "wrong"
                    ? "not right yet"
                    : "not attempted"
                }`}
                onClick={() => setIndex(i)}
              />
            );
          })}
        </SegmentBar>
        <ProgressLabel>
          Question {index + 1} of {tasks.length} · {correctCount} correct
          {untriedCount > 0 && ` · ${untriedCount} not attempted`}
        </ProgressLabel>
      </RunnerHeader>

      <RunnerColumns>
        <RunnerBody>
          <DraftNotice
            restored={savedDrafts.restored}
            onDiscard={savedDrafts.discard}
          />
          <Prompt ref={promptRef} tabIndex={-1}>
            {task.prompt}
          </Prompt>

          {task.type === ExerciseTaskType.QUIZ && (
            <>
              <TaskMeta>
                {task.allowMultiple ? "Select all that apply" : "Choose one"}
              </TaskMeta>
              <Border>
                {(
                  optionOrder[task.id] ?? task.options.map((_, i) => i)
                ).map((original) => (
                  <Option key={original}>
                    <OptionInput
                      type={task.allowMultiple ? "checkbox" : "radio"}
                      name={`${task.id}-option`}
                      checked={Array.isArray(draft) && draft.includes(original)}
                      disabled={checking || isCorrect}
                      onChange={() => {
                        const currentDraft = Array.isArray(draft) ? draft : [];
                        setDraft(
                          !task.allowMultiple
                            ? [original]
                            : currentDraft.includes(original)
                            ? currentDraft.filter((x) => x !== original)
                            : [...currentDraft, original]
                        );
                      }}
                    />
                    <span>{task.options[original]}</span>
                  </Option>
                ))}
              </Border>
            </>
          )}

          {task.type === ExerciseTaskType.SHORT_ANSWER && (
            <>
              <TaskMeta>Type your answer — as many tries as you like</TaskMeta>
              <Border>
                <ShortAnswerInput
                  type="text"
                  value={typeof draft === "string" ? draft : ""}
                  placeholder={task.placeholder ?? ""}
                  disabled={checking || isCorrect}
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
              disabled={checking || isCorrect}
              onChange={(text) => setDraft(text.slice(0, MAX_CODE_LENGTH))}
            />
          )}

          <div aria-live="polite">
            {current && (
              <Feedback $tone={current.status === "correct" ? "right" : "wrong"}>
                {current.status === "correct"
                  ? `Correct${
                      current.explanation ? ` — ${current.explanation}` : ""
                    }`
                  : `Not quite — try again, or move on and come back to it.`}
              </Feedback>
            )}
            {current?.code && <CodeFeedbackView feedback={current.code} />}
          </div>
        </RunnerBody>

        <HelpPanel aria-label="Help with this question">
          <HelpHeading>Where to look</HelpHeading>
          {task.helpText && <HelpBody>{task.helpText}</HelpBody>}
          {task.helpLinks?.length ? (
            <HelpLinkList>
              {task.helpLinks.map((link) => (
                <HelpLinkItem key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label} ↗
                  </a>
                </HelpLinkItem>
              ))}
            </HelpLinkList>
          ) : (
            !task.helpText && (
              <HelpBody>
                The guide behind this exercise covers everything asked here.
              </HelpBody>
            )
          )}

          {/* What they actually chose, explained. Comes before the generic
              hint because it answers the question they really asked. */}
          {current && current.status !== "correct" && current.answerNotes?.length ? (
            <>
              <HelpHeading>About your answer</HelpHeading>
              {current.answerNotes.map((note, i) => (
                <HelpBody key={i}>{note}</HelpBody>
              ))}
            </>
          ) : null}

          {/* The hint arrives once they have actually tried, so it nudges
              rather than answers. */}
          {current && current.status !== "correct" && current.hint && (
            <>
              <HelpHeading>Hint</HelpHeading>
              <HelpBody>{current.hint}</HelpBody>
            </>
          )}
        </HelpPanel>
      </RunnerColumns>

      <RunnerFooter>
        <Button
          $styletype="outlined"
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          ← Previous
        </Button>

        <Spacer />
        <Button
          $styletype="default"
          type="button"
          disabled={checking || !hasDraft || isCorrect}
          onClick={submitAnswer}
        >
          {checking
            ? task.type === ExerciseTaskType.CODE
              ? "Running your code…"
              : "Checking…"
            : isCorrect
            ? "Correct ✓"
            : "Check"}
        </Button>
        <Spacer />

        <Button
          $styletype="outlined"
          type="button"
          disabled={index >= tasks.length - 1}
          onClick={() => setIndex((i) => Math.min(tasks.length - 1, i + 1))}
        >
          Next →
        </Button>

        <Button
          $styletype="default"
          type="button"
          disabled={checking}
          onClick={() => setConfirmingFinish(true)}
        >
          Finish
          {untriedCount > 0 ? ` (${untriedCount} left)` : ""}
        </Button>
      </RunnerFooter>
    </RunnerShell>
  );
};
