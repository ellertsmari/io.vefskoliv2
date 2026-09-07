"use client";
import { useMemo, useState } from "react";
import { useFormDraft } from "utils/hooks/useStorage";
import { DraftNotice } from "UIcomponents/draftNotice/DraftNotice";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  GroupProjectDetails,
  PeerEvaluationEntry,
  SerializedTeam,
} from "types/groupTypes";
import {
  CONTRIBUTION_SCORES,
  PEER_AXIS_LABELS,
  PEER_BALANCE_MAX,
  PEER_SCORE_VALUES,
  TEAMBUILDING_SCORES,
  PeerAxis,
  PeerScoreInfo,
  peerBalance,
  rubricForProject,
} from "constants/groupWork";
import { submitPeerEvaluations } from "serverActions/groups/submitPeerEvaluations";
import { submitTeamEvaluation } from "serverActions/groups/submitTeamEvaluation";
import {
  Card,
  SectionTitle,
  MutedText,
  TextArea,
  PrimaryButton,
  SecondaryButton,
  Message,
  ChipRow,
  Pill,
  SelectableChip,
  SubmittedNote,
} from "../../styles";
import { MemberAvatar } from "./TeamHubTab";
import { TeamEvalForm } from "./TeamEvalForm";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const MemberHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: var(--text-base);
  font-weight: 600;
`;

const ScoreButtons = styled.div<{ $attention?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: ${({ $attention }) => ($attention ? "0.4rem" : "0")};
  margin: ${({ $attention }) => ($attention ? "0 -0.4rem" : "0")};
  border-radius: var(--radius-md);
  outline: ${({ $attention }) =>
    $attention ? "2px dashed var(--error-warning-100)" : "none"};
`;

const ScoreButton = styled.button<{ $selected: boolean }>`
  border: 1px solid ${({ $selected }) => ($selected ? "var(--primary-black-100)" : "var(--primary-black-10)")};
  background: ${({ $selected }) => ($selected ? "var(--primary-black-100)" : "white")};
  color: ${({ $selected }) => ($selected ? "white" : "var(--primary-black-60)")};
  border-radius: var(--radius-md);
  padding: 0.4rem 0.6rem;
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;

  &:hover {
    border-color: var(--primary-black-100);
  }
`;

const AxisLabel = styled.p`
  font-size: var(--text-sm);
  font-weight: 600;
  margin: 0;
  color: var(--primary-black-60);
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const BalanceCard = styled.div<{ $over: boolean; $sticky?: boolean }>`
  border: 2px solid
    ${({ $over }) =>
      $over ? "var(--error-warning-100)" : "var(--primary-black-10)"};
  background: var(--primary-white);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  /* Stays in view while the list of teammates scrolls past, so the rule is
     visible at the moment a score pushes the balance over. */
  ${({ $sticky }) =>
    $sticky &&
    `
    position: sticky;
    top: 0.5rem;
    z-index: 5;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  `}
`;

const AxisBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const AxisHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: var(--text-sm);
  font-weight: 600;
`;

const StatusPill = styled.span<{ $tone: "ok" | "pending" | "over" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 700;
  color: ${({ $tone }) =>
    $tone === "pending" ? "var(--primary-black-100)" : "var(--primary-white)"};
  background: ${({ $tone }) =>
    $tone === "over"
      ? "var(--error-warning-100)"
      : $tone === "pending"
        ? "var(--primary-black-10)"
        : "var(--error-success-100)"};
`;

const Instruction = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--primary-black-100);
  line-height: 1.45;
`;

const NameChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--text-xs);
  color: var(--primary-black-60);
`;

const NameChip = styled.span`
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--error-warning-100);
  color: var(--primary-black-100);
  font-weight: 600;
`;

const ResetButton = styled.button`
  align-self: flex-start;
  border: 1px solid var(--primary-black-100);
  background: transparent;
  color: var(--primary-black-100);
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.7rem;
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--primary-black-5);
  }
`;

const ScoreSign = styled.span`
  font-size: var(--text-xs);
  font-weight: 700;
  opacity: 0.8;
`;

const OverNote = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-100);
`;

const Notice = styled.div`
  border: 1px solid var(--error-warning-100);
  background: var(--primary-black-5);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: var(--text-sm);
`;

/** The long explanation, out of the way until someone wants it. */
const HowItWorks = styled.details`
  font-size: var(--text-sm);
  color: var(--primary-black-60);

  summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--primary-black-100);
  }

  p {
    margin: 0.5rem 0 0;
    line-height: 1.5;
  }
`;

const Progress = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
`;

/** Sign a score the way the balance counts it: "+2", "0", "−1". */
const signed = (score: number) =>
  score > 0 ? `+${score}` : score < 0 ? `−${Math.abs(score)}` : "0";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

/**
 * The running total of one axis, which has to end at zero or less.
 *
 * Says what to do, not just what is wrong: how many steps to lower, who is
 * currently above average, and a one-tap way back to an even team. Shown
 * sticky above the list and again by the submit button, because a team of
 * five makes a long enough page that the rule would otherwise scroll out of
 * sight exactly when it starts mattering.
 */
const BalanceMeter = ({
  balances,
  members,
  evals,
  onReset,
  sticky = false,
}: {
  balances: Record<PeerAxis, number>;
  members: Array<{ _id: string; name: string }>;
  evals: Record<string, MemberEval>;
  onReset: (axis: PeerAxis) => void;
  sticky?: boolean;
}) => {
  const axes = Object.keys(PEER_AXIS_LABELS) as PeerAxis[];
  const scoreOf = (axis: PeerAxis, memberId: string) =>
    axis === "contribution"
      ? evals[memberId]?.contributionScore
      : evals[memberId]?.teambuildingScore;
  const scoredCount = (axis: PeerAxis) =>
    members.filter((member) => scoreOf(axis, member._id) != null).length;
  // Ups usually get picked before the downs that pay for them, so a high
  // balance halfway through is the normal state. Only a finished axis that is
  // still over gets flagged.
  const isOver = (axis: PeerAxis) =>
    balances[axis] > PEER_BALANCE_MAX && scoredCount(axis) === members.length;
  const over = axes.some(isOver);

  return (
    <BalanceCard $over={over} $sticky={sticky} aria-live="polite">
      {axes.map((axis) => {
        const balance = balances[axis];
        const scored = scoredCount(axis);
        const complete = scored === members.length;
        const axisOver = isOver(axis);
        const pending = !complete && balance > PEER_BALANCE_MAX;
        const aboveAverage = members
          .map((member) => ({ member, score: scoreOf(axis, member._id) ?? 0 }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score);
        return (
          <AxisBlock key={axis}>
            <AxisHead>
              <span>{PEER_AXIS_LABELS[axis]} balance</span>
              <StatusPill $tone={axisOver ? "over" : pending ? "pending" : "ok"}>
                {signed(balance)}
                {axisOver
                  ? " · needs balancing"
                  : complete
                    ? " · OK"
                    : ` so far · ${scored} of ${members.length} scored`}
              </StatusPill>
            </AxisHead>
            {pending ? (
              <NameChips>
                Keep going. Every step up needs a step down somewhere before
                you submit, and it is fine to sort that out at the end.
              </NameChips>
            ) : axisOver ? (
              <>
                <Instruction>
                  You have marked people up {balance} step
                  {balance === 1 ? "" : "s"} more than down. Lower {balance}{" "}
                  step{balance === 1 ? "" : "s"} in total on the{" "}
                  {PEER_AXIS_LABELS[axis].toLowerCase()} scores below, either
                  someone marked up or someone else marked down.
                </Instruction>
                {aboveAverage.length > 0 && (
                  <NameChips>
                    Above average right now:
                    {aboveAverage.map(({ member, score }) => (
                      <NameChip key={member._id}>
                        {member.name} {signed(score)}
                      </NameChip>
                    ))}
                  </NameChips>
                )}
                <ResetButton type="button" onClick={() => onReset(axis)}>
                  Set everyone&apos;s {PEER_AXIS_LABELS[axis].toLowerCase()} to
                  Average
                </ResetButton>
              </>
            ) : (
              <NameChips>
                Ups and downs cancel out. A team cannot be rated above its own
                average.
              </NameChips>
            )}
          </AxisBlock>
        );
      })}
    </BalanceCard>
  );
};

type MemberEval = {
  contributionScore: number | null;
  teambuildingScore: number | null;
  /** One justification per person, covering both scores. */
  comment: string;
};

const emptyEval: MemberEval = {
  contributionScore: null,
  teambuildingScore: null,
  comment: "",
};

/** Older submissions carried a comment per axis; show both, joined. */
const commentFrom = (entry: PeerEvaluationEntry) =>
  [entry.contributionComment, entry.teambuildingComment]
    .map((text) => text.trim())
    .filter((text, index, all) => text && all.indexOf(text) === index)
    .join("\n");

const ScorePicker = ({
  scores,
  value,
  onChange,
  labelPrefix,
  attention = false,
}: {
  scores: Record<number, PeerScoreInfo>;
  value: number | null;
  onChange: (score: number) => void;
  labelPrefix: string;
  /** Outline the picker: this score is part of an over-budget balance. */
  attention?: boolean;
}) => (
  <ScoreButtons $attention={attention}>
    {PEER_SCORE_VALUES.map((score) => (
      <ScoreButton
        key={score}
        type="button"
        $selected={value === score}
        title={scores[score].tooltip}
        aria-label={`${labelPrefix}: ${scores[score].label} (${signed(score)})`}
        onClick={() => onChange(score)}
      >
        <span aria-hidden>{scores[score].emoji}</span>
        {scores[score].label}
        <ScoreSign aria-hidden>{signed(score)}</ScoreSign>
      </ScoreButton>
    ))}
  </ScoreButtons>
);

/**
 * Step: rate yourself and your teammates. Private to the teachers, who turn
 * it into one confirmed figure per axis per student.
 */
export const TeammatesStep = ({
  details,
  userId,
}: {
  details: GroupProjectDetails;
  userId: string;
}) => {
  const router = useRouter();
  const myTeam = details.teams.find((team) => team._id === details.myTeamId);
  // Yourself first, then the rest of the team. Rating yourself is part of the
  // same form on the same two axes — the question is how the group work went,
  // and the student is part of the group.
  const members = myTeam
    ? [
        ...myTeam.members.filter((member) => member._id === userId),
        ...myTeam.members.filter((member) => member._id !== userId),
      ]
    : [];
  const alreadySubmitted = details.myPeerEvaluations.length > 0;

  const [evals, setEvals] = useState<Record<string, MemberEval>>(() =>
    Object.fromEntries(
      members.map((member) => {
        const existing = details.myPeerEvaluations.find(
          (entry: PeerEvaluationEntry) => entry.target === member._id
        );
        return [
          member._id,
          existing
            ? {
                contributionScore: existing.contributionScore,
                teambuildingScore: existing.teambuildingScore,
                comment: commentFrom(existing),
              }
            : { ...emptyEval },
        ];
      })
    )
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const draft = useFormDraft(
    `peer-eval:${details.project._id}:${userId}`,
    evals,
    setEvals
  );

  if (!details.project.peerEvalOpen) {
    return (
      <Card>
        <SectionTitle>Rate your teammates</SectionTitle>
        <MutedText>
          This opens once every team has presented. Your teachers close it
          again a few days later, so do it while the project is fresh.
        </MutedText>
      </Card>
    );
  }

  if (!myTeam || members.length === 0) {
    return (
      <Card>
        <SectionTitle>Rate your teammates</SectionTitle>
        <MutedText>
          You are not on a team in this project, so there is nobody for you to
          rate here. If that is a mistake, tell one of your teachers and they
          will put you on the right team.
        </MutedText>
      </Card>
    );
  }

  const update = (memberId: string, patch: Partial<MemberEval>) => {
    setEvals((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], ...patch },
    }));
  };

  /** Back to an even team on one axis; the justifications stay. */
  const resetAxis = (axis: PeerAxis) => {
    const field = axis === "contribution" ? "contributionScore" : "teambuildingScore";
    setEvals((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, entry]) => [id, { ...entry, [field]: 0 }])
      )
    );
  };

  /** Everybody Average on both axes — the shape of an even team. */
  const startEven = () => {
    setEvals((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, entry]) => [
          id,
          { ...entry, contributionScore: 0, teambuildingScore: 0 },
        ])
      )
    );
  };

  const incomplete = members.some((member) => {
    const entry = evals[member._id];
    return (
      entry.contributionScore === null ||
      entry.teambuildingScore === null ||
      !entry.comment.trim()
    );
  });

  const scores = members.map((member) => evals[member._id]);
  const balances: Record<PeerAxis, number> = {
    contribution: peerBalance(scores.map((entry) => entry.contributionScore)),
    teambuilding: peerBalance(scores.map((entry) => entry.teambuildingScore)),
  };
  const overBudget =
    balances.contribution > PEER_BALANCE_MAX ||
    balances.teambuilding > PEER_BALANCE_MAX;
  // Flag only once an axis is fully scored: while it is half done, a high
  // balance is expected and pointing at it just frightens people off.
  const axisComplete = (axis: PeerAxis) =>
    scores.every((entry) =>
      axis === "contribution"
        ? entry.contributionScore != null
        : entry.teambuildingScore != null
    );
  const flagged = {
    contribution:
      balances.contribution > PEER_BALANCE_MAX && axisComplete("contribution"),
    teambuilding:
      balances.teambuilding > PEER_BALANCE_MAX && axisComplete("teambuilding"),
  };
  const nothingScoredYet = scores.every(
    (entry) => entry.contributionScore === null && entry.teambuildingScore === null
  );

  // Answers saved before the balance rule existed are left exactly as they
  // were — the rule applies to what is submitted from now on. Say so, rather
  // than letting the student wonder why the form they already filled in is
  // suddenly complaining.
  const savedOverBudget =
    details.myPeerEvaluations.length > 0 &&
    (peerBalance(
      details.myPeerEvaluations.map((entry) => entry.contributionScore)
    ) > PEER_BALANCE_MAX ||
      peerBalance(
        details.myPeerEvaluations.map((entry) => entry.teambuildingScore)
      ) > PEER_BALANCE_MAX);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    const result = await submitPeerEvaluations({
      projectId: details.project._id,
      evaluations: members.map((member) => {
        const entry = evals[member._id];
        return {
          targetId: member._id,
          contributionScore: entry.contributionScore!,
          contributionComment: entry.comment,
          teambuildingScore: entry.teambuildingScore!,
        };
      }),
    });
    setSaving(false);
    setFeedback({
      text: result.success
        ? alreadySubmitted
          ? "Changes saved"
          : "Handed in — thank you!"
        : result.message,
      error: !result.success,
    });
    if (result.success) {
      draft.clear();
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Layout>
        <SectionTitle>Rate your teammates</SectionTitle>
        {alreadySubmitted && (
          <SubmittedNote role="status">
            ✓ Handed in. You can change your answers until your teachers close
            this.
          </SubmittedNote>
        )}
        <DraftNotice restored={draft.restored} onDiscard={draft.discard} />
        <MutedText>
          How did the group work go? Score yourself and each teammate on
          contribution and teamwork, <strong>compared with the rest of the
          team</strong>, and say why in a sentence or two. Only your teachers
          see this. It stays open until they close it.
        </MutedText>
        <HowItWorks>
          <summary>How the scores work</summary>
          <p>
            The scores are relative, so a team cannot be rated above its own
            average: marking somebody up means marking somebody else down, and
            each balance below has to end at 0 or less. If everyone pulled
            their weight equally, leave the whole team on Average.
          </p>
          <p>
            Your teachers read every answer, then confirm one contribution
            figure and one teamwork figure per student. Those confirmed figures
            are what turn the team&apos;s project grade into each person&apos;s
            own grade. Nothing you write here reaches another student.
          </p>
        </HowItWorks>
        {nothingScoredYet && (
          <div>
            <SecondaryButton type="button" onClick={startEven}>
              Everyone pulled their weight equally — start from Average
            </SecondaryButton>
          </div>
        )}
        {savedOverBudget && (
          <Notice>
            Your saved answers were given before this rule existed, and they
            stay on record as they are. If you change anything here, both
            balances have to reach 0 or less before it can be saved again.
          </Notice>
        )}
        <BalanceMeter
          balances={balances}
          members={members}
          evals={evals}
          onReset={resetAxis}
          sticky
        />
        {members.map((member) => {
          const entry = evals[member._id];
          const isSelf = member._id === userId;
          const contributionPushes =
            flagged.contribution && (entry.contributionScore ?? 0) > 0;
          const teambuildingPushes =
            flagged.teambuilding && (entry.teambuildingScore ?? 0) > 0;
          return (
            <Card key={member._id}>
              <MemberHeader>
                <MemberAvatar name={member.name} avatarUrl={member.avatarUrl} />
                {member.name}
                {isSelf && <Pill>You</Pill>}
              </MemberHeader>

              <AxisLabel>
                {isSelf
                  ? "Your contribution to the project"
                  : "Contribution to the project"}
              </AxisLabel>
              <ScorePicker
                scores={CONTRIBUTION_SCORES}
                value={entry.contributionScore}
                labelPrefix={
                  isSelf ? "Your own contribution" : `Contribution of ${member.name}`
                }
                onChange={(score) =>
                  update(member._id, { contributionScore: score })
                }
                attention={contributionPushes}
              />
              {contributionPushes && (
                <OverNote>
                  This {signed(entry.contributionScore!)} is part of what puts
                  the contribution balance over.
                </OverNote>
              )}

              <AxisLabel>
                {isSelf
                  ? "Your communication & teamwork"
                  : "Communication & teamwork"}
              </AxisLabel>
              <ScorePicker
                scores={TEAMBUILDING_SCORES}
                value={entry.teambuildingScore}
                labelPrefix={
                  isSelf ? "Your own teamwork" : `Teamwork of ${member.name}`
                }
                onChange={(score) =>
                  update(member._id, { teambuildingScore: score })
                }
                attention={teambuildingPushes}
              />
              {teambuildingPushes && (
                <OverNote>
                  This {signed(entry.teambuildingScore!)} is part of what puts
                  the teamwork balance over.
                </OverNote>
              )}

              <AxisLabel>
                {isSelf ? "Why these scores for yourself?" : "Why these scores?"}
              </AxisLabel>
              <TextArea
                value={entry.comment}
                placeholder="A sentence or two your teachers can go on"
                style={{ minHeight: "60px" }}
                required
                aria-label={`Why these scores for ${isSelf ? "yourself" : member.name}`}
                onChange={(event) =>
                  update(member._id, { comment: event.target.value })
                }
              />
            </Card>
          );
        })}
        <BalanceMeter
          balances={balances}
          members={members}
          evals={evals}
          onReset={resetAxis}
        />
        <Footer>
          <PrimaryButton
            type="submit"
            disabled={saving || incomplete || overBudget}
          >
            {saving
              ? "Submitting…"
              : alreadySubmitted
                ? "Save changes"
                : "Hand in"}
          </PrimaryButton>
          {(flagged.contribution || flagged.teambuilding) && (
            <Message $error>
              Not yet: the{" "}
              {(Object.keys(PEER_AXIS_LABELS) as PeerAxis[])
                .filter((axis) => flagged[axis])
                .map((axis) => PEER_AXIS_LABELS[axis].toLowerCase())
                .join(" and ")}{" "}
              balance is too high. See the box above for what to lower.
            </Message>
          )}
          {incomplete && !overBudget && (
            <MutedText>
              Pick both scores and write a reason for yourself and every
              teammate.
            </MutedText>
          )}
          {feedback && (
            <Message $error={feedback.error}>{feedback.text}</Message>
          )}
        </Footer>
      </Layout>
    </form>
  );
};

/** The other teams in the order they present; unscheduled ones last. */
const inPresentationOrder = (
  teams: SerializedTeam[],
  slots: GroupProjectDetails["project"]["presentationSlots"]
) => {
  const slotOf = new Map(slots.map((slot) => [slot.team, slot]));
  return [...teams].sort((a, b) => {
    const slotA = slotOf.get(a._id)?.startTime;
    const slotB = slotOf.get(b._id)?.startTime;
    if (slotA && slotB) return slotA.localeCompare(slotB);
    if (slotA) return -1;
    if (slotB) return 1;
    return a.name.localeCompare(b.name);
  });
};

/**
 * Step: score the other teams' presentations against the rubric. Built for
 * presentation day: teams in slot order, a running count, and after one is
 * handed in the next unscored team opens.
 */
export const PresentationsStep = ({
  details,
}: {
  details: GroupProjectDetails;
}) => {
  const { project } = details;
  const otherTeams = useMemo(
    () =>
      inPresentationOrder(
        details.teams.filter((team) => team._id !== details.myTeamId),
        project.presentationSlots
      ),
    [details.teams, details.myTeamId, project.presentationSlots]
  );
  const slotOf = (teamId: string) =>
    project.presentationSlots.find((slot) => slot.team === teamId);
  const isScored = (teamId: string) =>
    (details.myTeamEvaluations[teamId]?.length ?? 0) > 0;
  const firstUnscored = otherTeams.find((team) => !isScored(team._id));

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    firstUnscored?._id ?? otherTeams[0]?._id ?? null
  );
  const selectedTeam = otherTeams.find((team) => team._id === selectedTeamId);
  const scoredCount = otherTeams.filter((team) => isScored(team._id)).length;

  if (!project.teamEvalOpen) {
    return (
      <Card>
        <SectionTitle>Score the presentations</SectionTitle>
        <MutedText>
          {project.presentationDate
            ? `Opens on presentation day, ${formatDate(project.presentationDate)}. `
            : "Opens on presentation day. "}
          You will score every other team on the rubric while they present.
        </MutedText>
      </Card>
    );
  }

  if (otherTeams.length === 0) {
    return (
      <Card>
        <SectionTitle>Score the presentations</SectionTitle>
        <MutedText>There are no other teams to score.</MutedText>
      </Card>
    );
  }

  // After a save, move on to the next team that still needs a score — in
  // presentation order, starting after the one just done.
  const advance = (fromId: string) => {
    const index = otherTeams.findIndex((team) => team._id === fromId);
    const after = [...otherTeams.slice(index + 1), ...otherTeams.slice(0, index)];
    const next = after.find(
      (team) => team._id !== fromId && !isScored(team._id)
    );
    if (next) setSelectedTeamId(next._id);
  };

  return (
    <Layout>
      <SectionTitle>Score the presentations</SectionTitle>
      <MutedText>
        Score each team while they present, or straight after. Your scores and
        comments go to the team and the teachers. It stays open until your
        teachers close it, usually the day after presentations.
      </MutedText>
      <Progress aria-live="polite">
        {scoredCount === otherTeams.length
          ? `✓ All ${otherTeams.length} teams scored`
          : `${scoredCount} of ${otherTeams.length} teams scored`}
      </Progress>
      <ChipRow>
        {otherTeams.map((team) => {
          const slot = slotOf(team._id);
          return (
            <SelectableChip
              key={team._id}
              type="button"
              $selected={selectedTeamId === team._id}
              aria-pressed={selectedTeamId === team._id}
              onClick={() => setSelectedTeamId(team._id)}
            >
              {isScored(team._id) ? "✓ " : ""}
              {team.name}
              {slot ? ` · ${slot.startTime}` : ""}
            </SelectableChip>
          );
        })}
      </ChipRow>
      {selectedTeam && (
        <TeamEvalForm
          key={selectedTeam._id}
          heading={
            selectedTeam.projectName
              ? `${selectedTeam.name} — ${selectedTeam.projectName}`
              : selectedTeam.name
          }
          rubric={rubricForProject(project.rubric)}
          existing={details.myTeamEvaluations[selectedTeam._id] || []}
          draftKey={`team-eval:${project._id}:${selectedTeam._id}`}
          onSubmit={(data) =>
            submitTeamEvaluation({
              projectId: project._id,
              teamId: selectedTeam._id,
              ...data,
            })
          }
          onSubmitted={() => advance(selectedTeam._id)}
        />
      )}
    </Layout>
  );
};
