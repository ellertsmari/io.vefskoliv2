"use client";

import { useState } from "react";
import Modal from "UIcomponents/modal/modal";
import { Button } from "globalStyles/buttons/default/style";
import type { ExerciseSummary } from "serverActions/exerciseSession";
import { ExerciseRunner } from "./ExerciseRunner";
import { AttemptReview } from "./AttemptReview";
import {
  LauncherCard,
  LauncherHeading,
  LauncherNote,
  ProgressTrack,
  ProgressFill,
  ProgressLabel,
  PerfectBanner,
  PerfectText,
  Trophy,
} from "./launcherStyle";

/**
 * The exercise no longer sits open underneath the guide.
 *
 * A wall of questions below the material is intimidating to read past, so the
 * guide now ends with a single button and a progress bar, and the questions
 * live behind it. The label reflects where the student actually is, so they
 * always know whether they are starting, resuming, or improving.
 */

const LABELS: Record<
  ExerciseSummary["status"],
  { button: string; heading: string; note: string }
> = {
  notStarted: {
    button: "Start the exercise",
    heading: "Ready when you are",
    note: "One question at a time. Unlimited attempts, and your best score is the one that counts.",
  },
  inProgress: {
    button: "Continue the exercise",
    heading: "You're part way through",
    note: "Pick up where you left off — your answers so far are saved.",
  },
  canImprove: {
    button: "Start a new attempt",
    heading: "Finished — you can do better",
    note: "A new attempt is the whole exercise again with a different set of questions, and your best score is the one that counts.",
  },
  perfect: {
    button: "Take it again",
    heading: "Perfect score",
    note: "Everything right, first time. Nothing left to prove here.",
  },
};

export const ExerciseLauncher = ({
  guideId,
  summary,
}: {
  guideId: string;
  summary: ExerciseSummary;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [current, setCurrent] = useState(summary);

  const labels = LABELS[current.status];
  const percent =
    current.total > 0 ? (current.answered / current.total) * 100 : 0;
  const showProgress = current.status === "inProgress" && current.answered > 0;

  if (current.status === "perfect") {
    return (
      <LauncherCard>
        <PerfectBanner>
          <Trophy role="img" aria-label="trophy">
            🏆
          </Trophy>
          <PerfectText>
            <strong>Perfect score — 10/10</strong>
            <span>{labels.note}</span>
          </PerfectText>
        </PerfectBanner>
        <Modal
          size="xl"
          state={[isOpen, setIsOpen]}
          modalTrigger={
            <Button $styletype="outlined" type="button">
              {labels.button}
            </Button>
          }
          modalContent={
            <ExerciseRunner
              guideId={guideId}
              onClose={() => setIsOpen(false)}
              onSummaryChange={setCurrent}
            />
          }
        />

      {current.attemptCount > 0 && (
        <Modal
          size="lg"
          state={[isReviewOpen, setIsReviewOpen]}
          modalTrigger={
            <Button $styletype="outlined" type="button">
              Review your last attempt
            </Button>
          }
          modalContent={
            <AttemptReview
              guideId={guideId}
              onClose={() => setIsReviewOpen(false)}
            />
          }
        />
      )}
      </LauncherCard>
    );
  }

  return (
    <LauncherCard>
      <LauncherHeading>{labels.heading}</LauncherHeading>
      <LauncherNote>{labels.note}</LauncherNote>

      {showProgress && (
        <>
          <ProgressTrack
            role="progressbar"
            aria-valuenow={current.answered}
            aria-valuemin={0}
            aria-valuemax={current.total}
            aria-label="Exercise progress"
          >
            <ProgressFill $percent={percent} />
          </ProgressTrack>
          <ProgressLabel>
            {current.answered} of {current.total} answered
          </ProgressLabel>
        </>
      )}

      {current.bestScore !== null && (
        <ProgressLabel>
          Your best so far: <strong>{current.bestScore}/10</strong>
          {current.passed ? " (passed)" : " (not passed yet)"} ·{" "}
          {current.attemptCount} attempt
          {current.attemptCount === 1 ? "" : "s"}
        </ProgressLabel>
      )}

      <Modal
        size="xl"
        state={[isOpen, setIsOpen]}
        modalTrigger={
          <Button $styletype="default" type="button">
            {labels.button}
          </Button>
        }
        modalContent={
          <ExerciseRunner
            guideId={guideId}
            onClose={() => setIsOpen(false)}
            onSummaryChange={setCurrent}
          />
        }
      />

      {current.attemptCount > 0 && (
        <Modal
          size="lg"
          state={[isReviewOpen, setIsReviewOpen]}
          modalTrigger={
            <Button $styletype="outlined" type="button">
              Review your last attempt
            </Button>
          }
          modalContent={
            <AttemptReview
              guideId={guideId}
              onClose={() => setIsReviewOpen(false)}
            />
          }
        />
      )}
    </LauncherCard>
  );
};
