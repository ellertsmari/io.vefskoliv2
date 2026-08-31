import { PEER_BALANCE_MAX, round1 } from "constants/groupWork";

// Shared between getEvaluationReports (which shows the advice) and
// managePeerEvalResults (which records what a teacher made of it), so both
// answer "what did this student's team say about them" the same way.

export type PeerAggregate = {
  contributionAvg: number;
  teambuildingAvg: number;
  /** The two axes averaged — the single figure a teacher confirms. */
  combinedAvg: number;
  receivedCount: number;
};

export type PeerRow = {
  targetId: string;
  contributionScore: number;
  teambuildingScore: number;
};

/**
 * Per-student averages over every evaluation they received, their own
 * self-evaluation included: the team is assessing how the group work went and
 * the student is part of the group. Students who received nothing are absent
 * from the map rather than present with a zero.
 */
export function aggregatePeerEvaluations(
  rows: PeerRow[]
): Map<string, PeerAggregate> {
  const totals = new Map<
    string,
    { contribution: number; teambuilding: number; count: number }
  >();
  for (const row of rows) {
    const total = totals.get(row.targetId) ?? {
      contribution: 0,
      teambuilding: 0,
      count: 0,
    };
    total.contribution += row.contributionScore;
    total.teambuilding += row.teambuildingScore;
    total.count += 1;
    totals.set(row.targetId, total);
  }

  const aggregates = new Map<string, PeerAggregate>();
  for (const [targetId, total] of totals) {
    const contribution = total.contribution / total.count;
    const teambuilding = total.teambuilding / total.count;
    aggregates.set(targetId, {
      contributionAvg: round1(contribution),
      teambuildingAvg: round1(teambuilding),
      // Rounded once, from the unrounded means, so the combined figure cannot
      // drift from the two it summarizes.
      combinedAvg: round1((contribution + teambuilding) / 2),
      receivedCount: total.count,
    });
  }
  return aggregates;
}

/**
 * Which evaluators broke the balance rule — their scores on an axis add up to
 * more than zero. Only possible for evaluations stored before the rule
 * existed; the teacher report flags them rather than rewriting them.
 */
export function unbalancedEvaluators(
  rows: (PeerRow & { evaluatorId: string })[]
): Set<string> {
  const totals = new Map<string, { contribution: number; teambuilding: number }>();
  for (const row of rows) {
    const total = totals.get(row.evaluatorId) ?? {
      contribution: 0,
      teambuilding: 0,
    };
    total.contribution += row.contributionScore;
    total.teambuilding += row.teambuildingScore;
    totals.set(row.evaluatorId, total);
  }
  const unbalanced = new Set<string>();
  for (const [evaluatorId, total] of totals) {
    if (
      total.contribution > PEER_BALANCE_MAX ||
      total.teambuilding > PEER_BALANCE_MAX
    ) {
      unbalanced.add(evaluatorId);
    }
  }
  return unbalanced;
}
