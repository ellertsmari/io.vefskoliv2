/**
 * Peer Review System Business Rules
 *
 * The peer review workflow:
 * 1. Student submits a project return
 * 2. Other students review the submission (REQUIRED_REVIEWS_COUNT reviews needed)
 * 3. Teachers grade those reviews 1-10 (REQUIRED_GRADES_COUNT grades needed)
 * 4. Final grade is the average of the top 2 grades received
 */

/** Number of reviews required for a submission to pass */
export const REQUIRED_REVIEWS_COUNT = 2;

/** Number of grades required to complete a review */
export const REQUIRED_GRADES_COUNT = 2;

/** Number of NO_PASS votes required for a submission to fail */
export const FAIL_THRESHOLD = 2;

/** Minimum grade value */
export const MIN_GRADE = 0;

/** Maximum grade value */
export const MAX_GRADE = 10;

/** Number of top grades to average for final grade */
export const GRADES_TO_AVERAGE = 2;

/**
 * Grace period (in days) the peer-review process is given to complete before a
 * student is graded on partial reviews.
 *
 * Normally a student must give REQUIRED_REVIEWS_COUNT reviews to earn full review
 * points. Within this window they must still give the required reviews whenever
 * projects are available. But once this many days have passed since they first
 * submitted the guide, we apply a "soft floor": we grade them on whatever reviews
 * they did manage to give, regardless of whether more projects later appear. This
 * means a late-arriving project can no longer drag an already-earned grade back
 * down. See `hasExceededReviewGracePeriod`.
 */
export const REVIEW_GRACE_PERIOD_DAYS = 14;

/**
 * Months when final grades are issued, as JS `Date.getMonth()` values (0-indexed):
 * May (4), August (7), December (11).
 *
 * During these months the review grace period is WAIVED: a student's earned
 * reviews count toward their grade immediately, with no 14-day wait, so grades
 * are accurate and final when teachers issue them. See `isGradingMonth`.
 */
export const GRADING_MONTHS = [4, 7, 11];

/**
 * What a review grade means.
 *
 * This is the rubric teachers grade against, and it is the ONE definition of
 * it — the grading walkthrough, the slider a student sees on a graded review,
 * and the tips panel they see while writing one all read from here. It used to
 * live in three places that had drifted apart.
 *
 * It is expressed as five bands rather than ten separate sentences because
 * that is the resolution a human actually grades at: the difference between a
 * 7 and an 8 is "how much of this band", not a different rule.
 */
export type ReviewQualityBand = {
  /** Lowest grade in the band. */
  min: number;
  /** Highest grade in the band. */
  max: number;
  /** e.g. "7–8" — the band as students see it labelled. */
  label: string;
  /** What a review in this band looks like. */
  summary: string;
};

export const REVIEW_QUALITY_BANDS: ReviewQualityBand[] = [
  {
    min: 1,
    max: 2,
    label: "1–2",
    summary: 'Not helpful — just "good" or "bad" with no explanation.',
  },
  {
    min: 3,
    max: 4,
    label: "3–4",
    summary: "Barely helpful — very short, less than a paragraph.",
  },
  {
    min: 5,
    max: 6,
    label: "5–6",
    summary:
      "Helpful — points out specific things to improve or that were done well.",
  },
  {
    min: 7,
    max: 8,
    label: "7–8",
    summary:
      "Very helpful — a thoughtful review with specific advice and suggestions.",
  },
  {
    min: 9,
    max: 10,
    label: "9–10",
    summary:
      "Exceptional — thorough, with specific advice, suggestions to improve, AND praise for the good parts.",
  },
];

/** The band a grade falls in, or undefined if it is outside MIN_GRADE..MAX_GRADE. */
export const reviewQualityBand = (
  grade: number
): ReviewQualityBand | undefined =>
  REVIEW_QUALITY_BANDS.find((band) => grade >= band.min && grade <= band.max);

/** One line describing a grade, e.g. "7/10 — Very helpful — a thoughtful…". */
export const reviewGradeMeaning = (grade: number): string => {
  const band = reviewQualityBand(grade);
  return band ? `${grade}/10 — ${band.summary}` : `${grade}/10`;
};

/**
 * Per-value descriptions for the 1–10 grade slider, index 0 being grade 1.
 * Values inside the same band share a description — see REVIEW_QUALITY_BANDS.
 */
export const REVIEW_GRADE_MEANINGS: string[] = Array.from(
  { length: MAX_GRADE },
  (_, index) => reviewGradeMeaning(index + 1)
);
