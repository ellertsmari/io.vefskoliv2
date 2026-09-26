"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "UIcomponents/modal/modal";
import { Button } from "globalStyles/buttons/default/style";
import {
  getExerciseSummary,
  type ExerciseSummary,
} from "serverActions/exerciseSession";
import { ExerciseRunner } from "./ExerciseRunner";
import { passMark } from "./passMark";
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
 * live behind it. The label reflects where the student actually is.
 *
 * There is one attempt and it never closes, so the card only ever says
 * "start" or "continue" — never "try again".
 */

const LABELS: Record<
  ExerciseSummary["status"],
  { button: string; heading: string; note: string }
> = {
  notStarted: {
    button: "Start the exercise",
    heading: "Ready when you are",
    note: "Work through it at your own pace. Every answer is saved as you check it, so you can stop and carry on later on any computer.",
  },
  inProgress: {
    button: "Continue the exercise",
    heading: "You're part way through",
    note: "Pick up where you left off, on this computer or any other.",
  },
  passed: {
    button: "Continue the exercise",
    heading: "Passed",
    note: "You've reached the pass mark. Anything more you get right raises your grade.",
  },
  perfect: {
    button: "Open the exercise",
    heading: "Perfect score",
    note: "Everything right. Nothing left to prove here.",
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
  const [current, setCurrent] = useState(summary);

  // Re-read where the student stands whenever the exercise closes, so the
  // card reflects what was just saved rather than what it said on page load.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    let cancelled = false;
    getExerciseSummary(guideId).then((fresh) => {
      if (fresh && !cancelled) setCurrent(fresh);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, guideId]);

  const labels = LABELS[current.status];
  const percent =
    current.total > 0 ? (current.answered / current.total) * 100 : 0;

  const runner = (
    <Modal
      size="xl"
      state={[isOpen, setIsOpen]}
      modalTrigger={
        <Button
          $styletype={current.status === "perfect" ? "outlined" : "default"}
          type="button"
        >
          {labels.button}
        </Button>
      }
      modalContent={
        <ExerciseRunner guideId={guideId} onClose={() => setIsOpen(false)} />
      }
    />
  );

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
        {runner}
      </LauncherCard>
    );
  }

  return (
    <LauncherCard>
      <LauncherHeading>{labels.heading}</LauncherHeading>
      <LauncherNote>{labels.note}</LauncherNote>
      <LauncherNote>
        <strong>You need {passMark(current.passThreshold)} to pass.</strong>{" "}
        Multiple choice gets one guess: a wrong one locks the question, and a
        new question is worth half. Each wrong try at a short answer halves what
        it is worth. Coding tasks score on the code you end up with.
      </LauncherNote>

      {current.answered > 0 && (
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

      {current.score !== null && (
        <ProgressLabel>
          Your score: <strong>{current.score}/10</strong>
          {current.passed
            ? " (passed)"
            : ` (not passed yet — you need ${passMark(current.passThreshold)})`}
        </ProgressLabel>
      )}

      {runner}
    </LauncherCard>
  );
};
