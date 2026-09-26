"use client";

import { useEffect, useRef, useState } from "react";
import { useFormDraft } from "utils/hooks/useStorage";
import { DraftNotice } from "UIcomponents/draftNotice/DraftNotice";
import {
  openExercise,
  checkAnswer,
  newQuestion,
  type ExerciseItem,
} from "serverActions/exerciseSession";
import type { ScoreSummary } from "utils/exerciseAttemptState";
import {
  ExerciseTaskType,
  MAX_CODE_LENGTH,
  type ExerciseAnswerValue,
  type ExercisePublic,
  type ExerciseTaskPublic,
} from "types/guideTypes";
import { MAX_ANSWER_LENGTH } from "utils/shortAnswer";
import { Button } from "globalStyles/buttons/default/style";
import { Border } from "globalStyles/globalStyles";
import { CodeTaskFields, CodeFeedbackView } from "./CodeTask";
import { Option, OptionInput, ShortAnswerInput, TaskMeta } from "./style";
import { ProgressLabel } from "./launcherStyle";
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
  SegmentBar,
  Segment,
} from "./runnerStyle";
import { formatPoints, passMark } from "./passMark";

/**
 * The exercise, one question at a time, in the student's one attempt.
 *
 * Nothing advances on its own and nothing is locked except a multiple-choice
 * question guessed wrong: Previous and Next always work, and the segmented bar
 * jumps straight to any question. There is no Finish — every answer is saved
 * the moment it is checked, and the score is live. Closing is just closing.
 *
 * Answers are checked on the SERVER. The key never reaches the browser until
 * a question is locked, and the halving is counted there, not reported by the
 * client.
 */

type Phase = "loading" | "running" | "error";

/** How a question looks in the progress bar. */
const segmentState = (
  item: ExerciseItem | undefined
): "untried" | "correct" | "wrong" | "pending" => {
  switch (item?.status) {
    case "correct":
      return "correct";
    case "locked":
    case "tried":
      return "wrong";
    case "pending":
      return "pending";
    default:
      return "untried";
  }
};

const segmentLabel = (item: ExerciseItem | undefined): string => {
  switch (item?.status) {
    case "correct":
      return "correct";
    case "locked":
      return "locked";
    case "tried":
      return "not right yet";
    case "pending":
      return "waiting for your teacher";
    default:
      return "not attempted";
  }
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

/** What the last check said beyond the item's state. Client-side only. */
type CheckNotes = { hint?: string; answerNotes?: string[] };

export const ExerciseRunner = ({
  guideId,
  onClose,
}: {
  guideId: string;
  onClose: () => void;
}) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ExercisePublic | null>(null);
  const [items, setItems] = useState<Record<string, ExerciseItem>>({});
  const [score, setScore] = useState<ScoreSummary | null>(null);
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, ExerciseAnswerValue>>({});
  // Unsent answers survive a reload or a closed tab on this computer. Checked
  // ones are on the server and come back as `lastAnswer` anywhere.
  const savedDrafts = useFormDraft(
    exercise ? `exercise:${guideId}` : null,
    drafts,
    setDrafts
  );
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<Record<string, CheckNotes>>({});

  const promptRef = useRef<HTMLHeadingElement>(null);
  const [optionOrder, setOptionOrder] = useState<Record<string, number[]>>({});

  const tasks = exercise?.tasks ?? [];
  const task: ExerciseTaskPublic | undefined = tasks[index];
  const item = task ? items[task.id] : undefined;

  // ---- open -------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await openExercise(guideId);
      if (cancelled) return;
      if (!res.success) {
        setErrorMessage(res.message);
        setPhase("error");
        return;
      }
      const { exercise: opened, items: openedItems, score: openedScore } =
        res.data;
      setExercise(opened);
      setItems(openedItems);
      setScore(openedScore);
      const firstOpen = opened.tasks.findIndex(
        (t) => openedItems[t.id]?.status !== "correct"
      );
      setIndex(firstOpen === -1 ? 0 : firstOpen);
      // Shuffled after load rather than during render: shuffling while
      // rendering would not match what the server sent.
      const order: Record<string, number[]> = {};
      for (const t of opened.tasks) {
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

  const draft: ExerciseAnswerValue = task
    ? drafts[task.id] ?? item?.lastAnswer ?? blankDraft(task)
    : [];

  const setDraft = (value: ExerciseAnswerValue) => {
    if (!task) return;
    setDrafts((prev) => ({ ...prev, [task.id]: value }));
  };

  const hasDraft =
    task?.type === ExerciseTaskType.QUIZ
      ? Array.isArray(draft) && draft.length > 0
      : typeof draft === "string" && draft.trim().length > 0;

  const answerable =
    !!item && item.status !== "correct" && item.status !== "locked";

  const submitAnswer = async () => {
    if (!task || busy || !hasDraft || !answerable) return;
    setBusy(true);
    const res = await checkAnswer({ guideId, taskId: task.id, answer: draft });
    setBusy(false);

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }
    setErrorMessage(null);
    setItems((prev) => ({ ...prev, [task.id]: res.data.item }));
    setScore(res.data.score);
    setNotes((prev) => ({
      ...prev,
      [task.id]: { hint: res.data.hint, answerNotes: res.data.answerNotes },
    }));
    // Saved on the server now; the local draft would only shadow it.
    setDrafts((prev) => {
      const { [task.id]: _saved, ...rest } = prev;
      return rest;
    });
  };

  const replaceQuestion = async () => {
    if (!task || busy || item?.status !== "locked") return;
    setBusy(true);
    const res = await newQuestion({ guideId, taskId: task.id });
    setBusy(false);

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }
    setErrorMessage(null);
    const { replaced, task: next, item: nextItem, score: nextScore } = res.data;
    setExercise((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === replaced ? next : t)),
          }
        : prev
    );
    setItems((prev) => ({ ...prev, [next.id]: nextItem }));
    setScore(nextScore);
    if (next.type === ExerciseTaskType.QUIZ) {
      setOptionOrder((prev) => ({
        ...prev,
        [next.id]: shuffledIndices(next.options.length),
      }));
    }
    promptRef.current?.focus();
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

  if (phase === "error" || !exercise || !score) {
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

  if (!task || !item) return null;

  const currentNotes = notes[task.id];

  return (
    <RunnerShell>
      <RunnerHeader>
        <SegmentBar aria-label="Questions">
          {tasks.map((t, i) => (
            <Segment
              key={t.id}
              type="button"
              $state={segmentState(items[t.id])}
              $current={i === index}
              aria-current={i === index ? "step" : undefined}
              aria-label={`Question ${i + 1}: ${segmentLabel(items[t.id])}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </SegmentBar>
        <ProgressLabel>
          Question {index + 1} of {tasks.length} · Your score{" "}
          <strong>{score.score}/10</strong> · pass mark{" "}
          {passMark(exercise.passThreshold)}
          {score.perfect ? " · 🏆 perfect" : score.passed ? " · passed ✓" : ""}
        </ProgressLabel>
        <ProgressLabel>
          Every answer is saved as you check it — close this any time and carry
          on later, on any computer.
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
                {item.status === "open" &&
                  ` · one guess · worth ${formatPoints(item.worth)}`}
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
                      disabled={busy || !answerable}
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
              <TaskMeta>
                Type your answer
                {answerable && ` · worth ${formatPoints(item.worth)}`}
              </TaskMeta>
              <Border>
                <ShortAnswerInput
                  type="text"
                  value={typeof draft === "string" ? draft : ""}
                  placeholder={task.placeholder ?? ""}
                  disabled={busy || !answerable}
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
              disabled={busy || !answerable}
              onChange={(text) => setDraft(text.slice(0, MAX_CODE_LENGTH))}
            />
          )}

          <div aria-live="polite">
            {errorMessage && <Feedback $tone="wrong">{errorMessage}</Feedback>}
            <ItemFeedback task={task} item={item} />
            {item.code && <CodeFeedbackView feedback={item.code} />}
          </div>

          {item.status === "locked" && (
            <>
              <Button
                $styletype="default"
                type="button"
                disabled={busy || !item.canReplace}
                onClick={replaceQuestion}
              >
                {item.canReplace
                  ? `New question — worth ${formatPoints(item.worth)}`
                  : "No new questions left"}
              </Button>
              {item.canReplace && (
                <TaskMeta>
                  Each wrong answer halves what the next question on this topic
                  is worth.
                </TaskMeta>
              )}
            </>
          )}
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
          {item.status !== "correct" && currentNotes?.answerNotes?.length ? (
            <>
              <HelpHeading>About your answer</HelpHeading>
              {currentNotes.answerNotes.map((note, i) => (
                <HelpBody key={i}>{note}</HelpBody>
              ))}
            </>
          ) : null}

          {/* The hint arrives once they have actually tried, so it nudges
              rather than answers. */}
          {item.status !== "correct" && currentNotes?.hint && (
            <>
              <HelpHeading>Hint</HelpHeading>
              <HelpBody>{currentNotes.hint}</HelpBody>
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
          disabled={busy || !hasDraft || !answerable}
          onClick={submitAnswer}
        >
          {busy
            ? task.type === ExerciseTaskType.CODE
              ? "Running your code…"
              : "Checking…"
            : item.status === "correct"
            ? "Correct ✓"
            : item.status === "locked"
            ? "Locked"
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
        <Button $styletype="outlined" type="button" onClick={onClose}>
          Close
        </Button>
      </RunnerFooter>
    </RunnerShell>
  );
};

/** What happened on this question, in words. */
const ItemFeedback = ({
  task,
  item,
}: {
  task: ExerciseTaskPublic;
  item: ExerciseItem;
}) => {
  if (item.status === "correct") {
    return (
      <Feedback $tone="right">
        Correct — {formatPoints(item.earned)}
        {item.explanation ? `. ${item.explanation}` : ""}
      </Feedback>
    );
  }

  if (item.status === "locked" && task.type === ExerciseTaskType.QUIZ) {
    const answer = (item.reveal?.correctAnswers ?? [])
      .map((i) => task.options[i])
      .filter(Boolean)
      .join(", ");
    return (
      <Feedback $tone="wrong">
        Not quite. The answer was: <strong>{answer}</strong>
        {item.reveal?.explanation ? ` — ${item.reveal.explanation}` : ""}
        <br />
        This question is now locked.
      </Feedback>
    );
  }

  if (item.status === "pending") {
    return (
      <Feedback $tone="wrong">
        Close — your teacher will look at this answer, and it may yet be
        accepted. You can keep trying meanwhile; your next try is worth{" "}
        {formatPoints(item.worth)}.
      </Feedback>
    );
  }

  if (item.status === "tried" && task.type === ExerciseTaskType.SHORT_ANSWER) {
    return (
      <Feedback $tone="wrong">
        Not quite — try again. Your next try is worth{" "}
        {formatPoints(item.worth)}.
      </Feedback>
    );
  }

  return null;
};
