"use client";

import { useEffect, useState } from "react";
import {
  getAttemptReview,
  type AttemptReview as Review,
  type ReviewedTask,
} from "serverActions/exerciseSession";
import { ExerciseTaskType } from "types/guideTypes";
import { Button } from "globalStyles/buttons/default/style";
import { TaskMeta } from "./style";
import {
  RunnerShell,
  RunnerBody,
  RunnerFooter,
  Prompt,
  ScoreBig,
  ReviewRow,
  ReviewOutcome,
  ReviewAnswer,
  ReviewNote,
} from "./runnerStyle";

/**
 * A finished attempt, kept rather than thrown away.
 *
 * Everything here was already on screen during the attempt — the student's own
 * answers, whether each was right, and the explanations for the ones they got
 * right. Nothing new is revealed: the pool overlaps between attempts, so
 * handing over answers to questions they might meet again would empty "improve
 * your grade" of meaning.
 */

const OUTCOME: Record<
  ReviewedTask["outcome"],
  { label: string; tone: "good" | "ok" | "bad" | "none" }
> = {
  firstTry: { label: "Right first time", tone: "good" },
  gotThere: { label: "Got there", tone: "ok" },
  wrong: { label: "Not solved", tone: "bad" },
  notAttempted: { label: "Not attempted", tone: "none" },
};

export const AttemptReview = ({
  guideId,
  onClose,
}: {
  guideId: string;
  onClose: () => void;
}) => {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getAttemptReview(guideId);
      if (cancelled) return;
      setReview(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [guideId]);

  if (loading) {
    return (
      <RunnerShell>
        <RunnerBody>
          <p>Fetching your last attempt…</p>
        </RunnerBody>
      </RunnerShell>
    );
  }

  if (!review) {
    return (
      <RunnerShell>
        <RunnerBody>
          <p>There is no finished attempt to look back at yet.</p>
        </RunnerBody>
        <RunnerFooter>
          <Button $styletype="default" type="button" onClick={onClose}>
            Close
          </Button>
        </RunnerFooter>
      </RunnerShell>
    );
  }

  const firstTry = review.tasks.filter((t) => t.outcome === "firstTry").length;
  const eventually = review.tasks.filter((t) => t.outcome === "gotThere").length;

  return (
    <RunnerShell>
      <RunnerBody>
        <Prompt as="h2">Attempt {review.attemptNumber}</Prompt>
        <ScoreBig>{review.score}/10</ScoreBig>
        <TaskMeta>
          {firstTry} of {review.tasks.length} right first time
          {eventually > 0 && `, ${eventually} after another try`}. Questions
          score on your first answer; coding problems score on what your code
          finally did.
        </TaskMeta>

        {review.tasks.map((task, i) => {
          const outcome = OUTCOME[task.outcome];
          return (
            <ReviewRow key={i}>
              <ReviewOutcome $tone={outcome.tone}>{outcome.label}</ReviewOutcome>
              <div>
                <strong>{task.prompt}</strong>
                <ReviewAnswer>
                  {task.type === ExerciseTaskType.CODE &&
                  task.testsTotal !== undefined
                    ? `${task.testsPassed} of ${task.testsTotal} tests passed`
                    : `You answered: ${task.yourAnswer}`}
                  {task.tries > 1 && ` · ${task.tries} tries`}
                </ReviewAnswer>
                {task.explanation && <ReviewNote>{task.explanation}</ReviewNote>}
              </div>
            </ReviewRow>
          );
        })}
      </RunnerBody>
      <RunnerFooter>
        <Button $styletype="default" type="button" onClick={onClose}>
          Close
        </Button>
      </RunnerFooter>
    </RunnerShell>
  );
};
