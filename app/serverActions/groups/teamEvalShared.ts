import { z } from "zod";
import { TeamEvaluation } from "models/teamEvaluation";
import {
  DEFAULT_PANEL_WEIGHT,
  EVALUATION_MAX_SCORE,
  EVALUATION_MIN_SCORE,
  JudgeFocus,
  OVERALL_CATEGORY,
  RubricItem,
  requiredRubricKeys,
  round1,
  rubricForProject,
} from "constants/groupWork";
import { TeamEvalSummary, TeamEvaluationEntry } from "types/groupTypes";

// Shared between submitTeamEvaluation (logged-in students/teachers) and
// submitJudgeEvaluation (external judges via token link). Not server actions.

export const teamEvalEntriesSchema = z
  .array(
    z.object({
      // validated against the project's rubric after the project is loaded
      category: z.string().trim().min(1).max(100),
      score: z
        .number()
        .int()
        .min(EVALUATION_MIN_SCORE)
        .max(EVALUATION_MAX_SCORE),
      comment: z.string().trim().max(5000).default(""),
    })
  )
  .min(1)
  .max(50);

export const overallCommentSchema = z.string().trim().max(5000).default("");

export type TeamEvalEntry = z.output<typeof teamEvalEntriesSchema>[number];

/**
 * Cross-field rules for one evaluation submission. Every category must exist
 * in the rubric, the categories required for the evaluator's focus must all
 * be scored, and there must be at least one comment somewhere (a rubric row
 * or the overall box). Returns an error message, or null when valid.
 */
export function validateTeamEvalSubmission({
  rubric,
  entries,
  overallComment,
  focus = null,
}: {
  rubric: RubricItem[] | null | undefined;
  entries: TeamEvalEntry[];
  overallComment: string;
  focus?: JudgeFocus | null;
}): string | null {
  const allowed = new Set(rubricForProject(rubric).map((item) => item.key));
  for (const entry of entries) {
    if (!allowed.has(entry.category)) {
      return "Unknown evaluation category for this project";
    }
  }

  const scored = new Set(entries.map((entry) => entry.category));
  for (const key of requiredRubricKeys(rubric, focus)) {
    if (!scored.has(key)) {
      return "Give a score for every required category";
    }
  }

  const hasComment =
    overallComment.length > 0 ||
    entries.some((entry) => entry.comment.length > 0);
  if (!hasComment) {
    return "Write at least one comment — under a grade or in the overall comment box";
  }
  return null;
}


/** Shape of a lean TeamEvaluation row as the grouping/summary helpers need it. */
export type LeanEvaluationRow = {
  team: { toString(): string };
  category: string;
  score?: number | null;
  comment?: string | null;
};

/** Group one evaluator's lean TeamEvaluation rows into client-safe entries keyed by team id. */
export function groupEvaluationEntriesByTeam(
  evaluations: LeanEvaluationRow[]
): Record<string, TeamEvaluationEntry[]> {
  const byTeam: Record<string, TeamEvaluationEntry[]> = {};
  for (const entry of evaluations) {
    (byTeam[entry.team.toString()] ||= []).push({
      category: entry.category,
      score: entry.score ?? null,
      comment: entry.comment || "",
    });
  }
  return byTeam;
}

/**
 * Per-team, per-category score summaries.
 *
 * Panel entries (teachers and invited judges) weigh alike and carry
 * `panelWeight` of each category; the student audience carries the rest. When
 * only one side scored a category the weighting renormalises onto whichever
 * side that is — unless that side's share is zero, in which case the category
 * has no score at all. That last case is the whole point of a 100/0 project:
 * a row only the audience scored must not quietly become the team's grade.
 *
 * A judge who was asked to judge one discipline counts only on that discipline
 * and the general rows. Their other scores are kept, just not counted, so a
 * teacher moving a judge between focuses changes the averages back and forth
 * without anything being lost. Score-less entries (the "overall" comment) are
 * excluded throughout.
 */
export function summarizeTeamEvaluations(
  evaluations: {
    team: { toString(): string };
    category: string;
    score?: number | null;
    isPanel: boolean;
    /** Set for external judges; null/absent for teachers and students. */
    judgeFocus?: JudgeFocus | null;
  }[],
  {
    rubric,
    panelWeight = DEFAULT_PANEL_WEIGHT,
  }: { rubric?: RubricItem[] | null; panelWeight?: number } = {}
): Record<string, TeamEvalSummary> {
  type Bucket = {
    panelSum: number;
    panelCount: number;
    audienceSum: number;
    audienceCount: number;
  };
  const buckets = new Map<string, Map<string, Bucket>>();

  // One set per focus rather than one per row.
  const countableKeys = new Map<JudgeFocus, Set<string>>();
  const countsFor = (focus: JudgeFocus, category: string) => {
    let keys = countableKeys.get(focus);
    if (!keys) {
      keys = requiredRubricKeys(rubric, focus);
      countableKeys.set(focus, keys);
    }
    return keys.has(category);
  };

  for (const entry of evaluations) {
    if (entry.score == null) continue;
    if (
      entry.judgeFocus &&
      entry.judgeFocus !== "all" &&
      !countsFor(entry.judgeFocus, entry.category)
    ) {
      continue;
    }
    const teamId = entry.team.toString();
    const byCategory =
      buckets.get(teamId) ?? new Map<string, Bucket>();
    buckets.set(teamId, byCategory);
    const bucket = byCategory.get(entry.category) ?? {
      panelSum: 0,
      panelCount: 0,
      audienceSum: 0,
      audienceCount: 0,
    };
    byCategory.set(entry.category, bucket);
    if (entry.isPanel) {
      bucket.panelSum += entry.score;
      bucket.panelCount += 1;
    } else {
      bucket.audienceSum += entry.score;
      bucket.audienceCount += 1;
    }
  }

  const summaries: Record<string, TeamEvalSummary> = {};
  for (const [teamId, byCategory] of buckets) {
    const summary: TeamEvalSummary = {};
    for (const [category, bucket] of byCategory) {
      const panelAvg = bucket.panelCount
        ? bucket.panelSum / bucket.panelCount
        : null;
      const audienceAvg = bucket.audienceCount
        ? bucket.audienceSum / bucket.audienceCount
        : null;

      // A side that scored nothing, or that was given no share, contributes
      // nothing and its share goes to the other one.
      const panelShare = panelAvg == null ? 0 : panelWeight;
      const audienceShare = audienceAvg == null ? 0 : 1 - panelWeight;
      const totalShare = panelShare + audienceShare;
      if (totalShare === 0) continue;

      const avg =
        (panelShare * (panelAvg ?? 0) + audienceShare * (audienceAvg ?? 0)) /
        totalShare;
      summary[category] = {
        avg: round1(avg),
        count: bucket.panelCount + bucket.audienceCount,
      };
    }
    summaries[teamId] = summary;
  }
  return summaries;
}

/**
 * Upsert one evaluator's scores (and overall comment) for one team. `owner`
 * is either `{ evaluator }` for logged-in users or `{ judge }` for external
 * judges — it scopes the writes so a re-submission fully replaces the earlier
 * one: categories no longer submitted (a judge skipping an optional row, a
 * removed rubric row) are deleted rather than left counting in the averages.
 */
export async function upsertTeamEvaluation({
  projectId,
  teamId,
  owner,
  entries,
  overallComment,
}: {
  projectId: string;
  teamId: string;
  owner: { evaluator: string } | { judge: string };
  entries: TeamEvalEntry[];
  overallComment: string;
}): Promise<void> {
  const scope = { project: projectId, team: teamId, ...owner };
  const writes: Promise<unknown>[] = entries.map((entry) =>
    TeamEvaluation.findOneAndUpdate(
      { ...scope, category: entry.category },
      { $set: { score: entry.score, comment: entry.comment } },
      { upsert: true }
    )
  );
  writes.push(
    overallComment
      ? TeamEvaluation.findOneAndUpdate(
          { ...scope, category: OVERALL_CATEGORY },
          { $set: { comment: overallComment }, $unset: { score: 1 } },
          { upsert: true }
        )
      : TeamEvaluation.deleteOne({ ...scope, category: OVERALL_CATEGORY }),
    TeamEvaluation.deleteMany({
      ...scope,
      category: {
        $nin: [...entries.map((entry) => entry.category), OVERALL_CATEGORY],
      },
    })
  );
  await Promise.all(writes);
}
