"use client";
import { useState } from "react";
import { useFormDraft } from "utils/hooks/useStorage";
import { DraftNotice } from "UIcomponents/draftNotice/DraftNotice";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { GroupProjectDetails, PeerEvaluationEntry } from "types/groupTypes";
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
  Message,
  ChipRow,
  Pill,
  SelectableChip,
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
    $attention ? "2px dashed var(--error-failure-100)" : "none"};
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
`;

const BalanceCard = styled.div<{ $over: boolean; $sticky?: boolean }>`
  border: 2px solid
    ${({ $over }) =>
      $over ? "var(--error-failure-100)" : "var(--primary-black-10)"};
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
      ? "var(--error-failure-100)"
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
  border: 1px solid var(--error-failure-100);
  color: var(--error-failure-100);
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
  color: var(--error-failure-100);
`;

const Notice = styled.div`
  border: 1px solid var(--error-warning-100);
  background: var(--primary-black-5);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: var(--text-sm);
`;

/** Sign a score the way the balance counts it: "+2", "0", "−1". */
const signed = (score: number) =>
  score > 0 ? `+${score}` : score < 0 ? `−${Math.abs(score)}` : "0";

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
  // still over gets the red treatment.
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
                  ? " · too high"
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
  contributionComment: string;
  teambuildingScore: number | null;
  teambuildingComment: string;
};

const emptyEval: MemberEval = {
  contributionScore: null,
  contributionComment: "",
  teambuildingScore: null,
  teambuildingComment: "",
};

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

const PeerEvaluationSection = ({
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
                contributionComment: existing.contributionComment,
                teambuildingScore: existing.teambuildingScore,
                teambuildingComment: existing.teambuildingComment,
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

  if (!myTeam || members.length === 0) {
    return (
      <MutedText>
        Peer evaluation is open, but you are not on a team in this project.
      </MutedText>
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

  const incomplete = members.some((member) => {
    const entry = evals[member._id];
    return (
      entry.contributionScore === null ||
      entry.teambuildingScore === null ||
      !entry.contributionComment.trim() ||
      !entry.teambuildingComment.trim()
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
  // Red only once an axis is fully scored: while it is half done, a high
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
          contributionComment: entry.contributionComment,
          teambuildingScore: entry.teambuildingScore!,
          teambuildingComment: entry.teambuildingComment,
        };
      }),
    });
    setSaving(false);
    setFeedback({
      text: result.success ? "Peer evaluation submitted!" : result.message,
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
        <DraftNotice restored={draft.restored} onDiscard={draft.discard} />
        <MutedText>
          Rate yourself and each teammate honestly — this is about how the
          group work went as a whole, and you are part of the group. Your
          answers go to your teachers only, never to other students, and a
          short justification is required for every score. Your teachers read
          all of it, then confirm one contribution figure and one teamwork
          figure for each student — those confirmed figures, not these scores
          directly, are what turn the team’s project grade into each person’s
          own grade.
        </MutedText>
        <MutedText>
          The scores are <strong>relative</strong>: each one says how that
          person did compared with the rest of the team, so a team cannot be
          rated above its own average. Marking somebody up means marking
          somebody else down, and the balance below has to end at 0 or less. If
          everyone pulled their weight equally, leave the whole team on
          Average — that is what an even team looks like.
        </MutedText>
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
              <TextArea
                value={entry.contributionComment}
                placeholder="Why did you pick this score?"
                style={{ minHeight: "60px" }}
                required
                onChange={(event) =>
                  update(member._id, {
                    contributionComment: event.target.value,
                  })
                }
              />

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
              <TextArea
                value={entry.teambuildingComment}
                placeholder="Why did you pick this score?"
                style={{ minHeight: "60px" }}
                required
                onChange={(event) =>
                  update(member._id, {
                    teambuildingComment: event.target.value,
                  })
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
            {saving ? "Submitting…" : "Submit peer evaluation"}
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
          {incomplete && (
            <MutedText>
              Pick both scores and write both justifications for yourself and
              every teammate.
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

const TeamEvaluationSection = ({
  details,
}: {
  details: GroupProjectDetails;
}) => {
  const otherTeams = details.teams.filter(
    (team) => team._id !== details.myTeamId
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    otherTeams[0]?._id ?? null
  );
  const selectedTeam = otherTeams.find((team) => team._id === selectedTeamId);

  if (otherTeams.length === 0) {
    return <MutedText>There are no other teams to evaluate.</MutedText>;
  }

  return (
    <Layout>
      <MutedText>
        Score the other teams&apos; presentations. Pick a team to evaluate:
      </MutedText>
      <ChipRow>
        {otherTeams.map((team) => {
          const done = (details.myTeamEvaluations[team._id]?.length ?? 0) > 0;
          return (
            <SelectableChip
              key={team._id}
              type="button"
              $selected={selectedTeamId === team._id}
              onClick={() => setSelectedTeamId(team._id)}
            >
              {team.name}
              {done ? " ✓" : ""}
            </SelectableChip>
          );
        })}
      </ChipRow>
      {selectedTeam && (
        <TeamEvalForm
          key={selectedTeam._id}
          heading={`Evaluate ${selectedTeam.name}`}
          rubric={rubricForProject(details.project.rubric)}
          existing={details.myTeamEvaluations[selectedTeam._id] || []}
          draftKey={`team-eval:${details.project._id}:${selectedTeam._id}`}
          onSubmit={(data) =>
            submitTeamEvaluation({
              projectId: details.project._id,
              teamId: selectedTeam._id,
              ...data,
            })
          }
        />
      )}
    </Layout>
  );
};

export const EvaluateTab = ({
  details,
  userId,
}: {
  details: GroupProjectDetails;
  userId: string;
}) => {
  return (
    <Layout>
      {details.project.peerEvalOpen && details.myTeamId && (
        <section>
          <Layout>
            <SectionTitle>Peer evaluation — you and your teammates</SectionTitle>
            <PeerEvaluationSection details={details} userId={userId} />
          </Layout>
        </section>
      )}
      {details.project.teamEvalOpen && (
        <section>
          <Layout>
            <SectionTitle>Team evaluation — other teams</SectionTitle>
            <TeamEvaluationSection details={details} />
          </Layout>
        </section>
      )}
    </Layout>
  );
};
