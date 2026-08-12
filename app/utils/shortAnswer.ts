import { TaskStatus } from "types/guideTypes";

/**
 * Matching for short-answer tasks.
 *
 * A teacher writes the answers they will accept; matching is forgiving about
 * case, surrounding whitespace and trailing punctuation, and a regex is
 * available for answers with real variation. Anything close to an accepted
 * answer but not equal to it is held as `pending` rather than marked wrong, so
 * a phrasing the teacher did not think of can be promoted into the key instead
 * of quietly failing students. See docs/exercise-engine-tasks.md, decisions 1–2.
 */

/**
 * Longest answer we will consider. Bounds the work done by both the Levenshtein
 * comparison and any teacher-authored regex — a pathological pattern on a very
 * long input is the one way this could tie up a request.
 */
export const MAX_ANSWER_LENGTH = 500;

/**
 * Case, surrounding whitespace, internal whitespace runs and trailing sentence
 * punctuation are all noise. "  Const. " and "const" are the same answer.
 */
export const normalizeAnswer = (raw: string): string =>
  raw
    .slice(0, MAX_ANSWER_LENGTH)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]+$/, "")
    .trim();

/**
 * How far off an answer may be and still be held for review rather than marked
 * wrong. Scaled to length, and zero for very short answers: on a three-character
 * answer a single edit is usually a different answer ("3" vs "4"), not a typo.
 */
export const nearMissThreshold = (accepted: string): number => {
  if (accepted.length < 4) return 0;
  if (accepted.length <= 8) return 1;
  return 2;
};

/**
 * Levenshtein distance, abandoned as soon as it exceeds `max`. Two rolling rows
 * rather than a full matrix; inputs are already capped at MAX_ANSWER_LENGTH.
 */
export const editDistance = (a: string, b: string, max: number): number => {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    // Every later row can only grow, so once the best cell in this row is
    // already past the ceiling there is no point continuing.
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }

  return prev[b.length];
};

/** The answer key for a short-answer task. */
export type ShortAnswerKey = {
  /** answers marked correct outright, compared after normalization */
  acceptedAnswers: string[];
  /**
   * Optional regex source for answers with real variation. Applied to the
   * normalized answer, case-insensitively. An invalid pattern is ignored rather
   * than throwing — a typo in the key must not break the exercise for students.
   */
  pattern?: string;
};

export type ShortAnswerMatch = {
  status: TaskStatus;
  /** which accepted answer it matched or came closest to, when there was one */
  matched?: string;
};

const patternMatches = (pattern: string, normalized: string): boolean => {
  try {
    return new RegExp(pattern, "i").test(normalized);
  } catch {
    return false;
  }
};

/**
 * Grade one short answer against its key.
 *
 * Exact (normalized) match or a pattern match is `correct`. Within the
 * near-miss threshold of an accepted answer is `pending`. Everything else,
 * including a blank answer, is `incorrect`.
 */
export const matchShortAnswer = (
  key: ShortAnswerKey,
  raw: unknown
): ShortAnswerMatch => {
  if (typeof raw !== "string") return { status: "incorrect" };

  const answer = normalizeAnswer(raw);
  if (!answer) return { status: "incorrect" };

  const accepted = (key.acceptedAnswers ?? []).map(normalizeAnswer);

  const exact = accepted.find((a) => a === answer);
  if (exact) return { status: "correct", matched: exact };

  if (key.pattern && patternMatches(key.pattern, answer)) {
    return { status: "correct" };
  }

  for (const candidate of accepted) {
    const max = nearMissThreshold(candidate);
    if (max > 0 && editDistance(candidate, answer, max) <= max) {
      return { status: "pending", matched: candidate };
    }
  }

  return { status: "incorrect" };
};
