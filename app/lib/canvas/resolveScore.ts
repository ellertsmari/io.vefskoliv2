import {
  ExtendedGuideInfo,
  GradesReceivedStatus,
  ReturnStatus,
} from "types/guideTypes";
import { CANVAS_SCORE_MAXIMUM, CanvasScore } from "./types";

/**
 * Turn a student's computed state for one guide into a Canvas score.
 *
 * The subtlety this function exists to contain: inside the app a grade is a
 * PROGRESS reading. `calculateGrade` returns `undefined` for both "nothing
 * submitted" and "peers failed it", and returns a bare 5 for "submitted, no
 * review grades yet" — deliberately, because the number is there to apply
 * pressure. A Canvas gradebook reads the same values as final judgements, and
 * an ungraded cell is weighted differently from a zero. Three states have to be
 * separated on the way out:
 *
 *   nothing submitted  -> no score at all, NotReady. A blank Canvas cell, which
 *                         is what an unsubmitted assignment is. Pushing 0 here
 *                         would fail every student for work that is not yet due.
 *   failed by peers    -> an explicit 0, FullyGraded. A real, final outcome.
 *   submitted, partial -> the interim number, but PendingManual, so the column
 *                         shows progress without claiming to be final.
 *
 * Auto-graded guides come through the same path: `buildAutoGradedInfo` puts the
 * best attempt's score in `grade` and marks the peer-review steps N/A, so a
 * failed attempt carries a real score (4/10, say) rather than `undefined`. Hence
 * `grade ?? 0` on the failure branch instead of a hardcoded zero — it must not
 * overwrite a score the exercise engine actually computed.
 */
export const resolveCanvasScore = (guide: ExtendedGuideInfo): CanvasScore => {
  const scoreMaximum = CANVAS_SCORE_MAXIMUM;

  if (guide.returnStatus === ReturnStatus.NOT_RETURNED) {
    return {
      scoreMaximum,
      activityProgress: "Initialized",
      gradingProgress: "NotReady",
    };
  }

  if (guide.returnStatus === ReturnStatus.FAILED) {
    // Final: a no-pass verdict is not waiting on anything further.
    return {
      scoreGiven: guide.grade ?? 0,
      scoreMaximum,
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
    };
  }

  // Passed, awaiting reviews, or in the hall of fame. Whether the number is
  // final depends only on whether the review grades that feed it have arrived.
  const awaitingGrades =
    guide.gradesReceivedStatus === GradesReceivedStatus.AWAITING_GRADES;

  return {
    scoreGiven: guide.grade ?? 0,
    scoreMaximum,
    activityProgress: awaitingGrades ? "Submitted" : "Completed",
    gradingProgress: awaitingGrades ? "PendingManual" : "FullyGraded",
  };
};

/**
 * Whether two scores mean the same thing, used to skip no-op pushes.
 *
 * Worth having because the reconciling sweep recomputes every student against
 * every guide on a schedule; without this it would re-POST thousands of
 * unchanged scores to Canvas on every run, and every one of those would show up
 * in the Canvas gradebook history as a fresh grade change.
 */
export const scoresAreEquivalent = (a: CanvasScore, b: CanvasScore): boolean =>
  a.scoreGiven === b.scoreGiven &&
  a.scoreMaximum === b.scoreMaximum &&
  a.activityProgress === b.activityProgress &&
  a.gradingProgress === b.gradingProgress;
