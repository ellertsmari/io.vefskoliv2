"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { GroupProjectDetails, PeerEvaluationEntry } from "types/groupTypes";
import {
  CONTRIBUTION_SCORES,
  PEER_SCORE_VALUES,
  TEAMBUILDING_SCORES,
  PeerScoreInfo,
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
  font-size: 1rem;
  font-weight: 600;
`;

const ScoreButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const ScoreButton = styled.button<{ $selected: boolean }>`
  border: 1px solid ${({ $selected }) => ($selected ? "#000" : "#e9ecef")};
  background: ${({ $selected }) => ($selected ? "#000" : "white")};
  color: ${({ $selected }) => ($selected ? "white" : "#495057")};
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;

  &:hover {
    border-color: #000;
  }
`;

const AxisLabel = styled.p`
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
  color: #495057;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

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
}: {
  scores: Record<number, PeerScoreInfo>;
  value: number | null;
  onChange: (score: number) => void;
  labelPrefix: string;
}) => (
  <ScoreButtons>
    {PEER_SCORE_VALUES.map((score) => (
      <ScoreButton
        key={score}
        type="button"
        $selected={value === score}
        title={scores[score].tooltip}
        aria-label={`${labelPrefix}: ${scores[score].label}`}
        onClick={() => onChange(score)}
      >
        <span aria-hidden>{scores[score].emoji}</span>
        {scores[score].label}
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
  const teammates =
    myTeam?.members.filter((member) => member._id !== userId) || [];

  const [evals, setEvals] = useState<Record<string, MemberEval>>(() =>
    Object.fromEntries(
      teammates.map((member) => {
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

  if (!myTeam || teammates.length === 0) {
    return (
      <MutedText>
        Peer evaluation is open, but you have no teammates to evaluate.
      </MutedText>
    );
  }

  const update = (memberId: string, patch: Partial<MemberEval>) => {
    setEvals((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], ...patch },
    }));
  };

  const incomplete = teammates.some((member) => {
    const entry = evals[member._id];
    return (
      entry.contributionScore === null ||
      entry.teambuildingScore === null ||
      !entry.contributionComment.trim() ||
      !entry.teambuildingComment.trim()
    );
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    const result = await submitPeerEvaluations({
      projectId: details.project._id,
      evaluations: teammates.map((member) => {
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
    if (result.success) router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Layout>
        <MutedText>
          Rate each teammate honestly — your answers go to your teachers only,
          never to other students. A short justification is required for every
          score.
        </MutedText>
        {teammates.map((member) => {
          const entry = evals[member._id];
          return (
            <Card key={member._id}>
              <MemberHeader>
                <MemberAvatar name={member.name} avatarUrl={member.avatarUrl} />
                {member.name}
              </MemberHeader>

              <AxisLabel>Contribution to the project</AxisLabel>
              <ScorePicker
                scores={CONTRIBUTION_SCORES}
                value={entry.contributionScore}
                labelPrefix={`Contribution of ${member.name}`}
                onChange={(score) =>
                  update(member._id, { contributionScore: score })
                }
              />
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

              <AxisLabel>Communication & teamwork</AxisLabel>
              <ScorePicker
                scores={TEAMBUILDING_SCORES}
                value={entry.teambuildingScore}
                labelPrefix={`Teamwork of ${member.name}`}
                onChange={(score) =>
                  update(member._id, { teambuildingScore: score })
                }
              />
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
        <Footer>
          <PrimaryButton type="submit" disabled={saving || incomplete}>
            {saving ? "Submitting…" : "Submit peer evaluation"}
          </PrimaryButton>
          {incomplete && (
            <MutedText>
              Pick both scores and write both justifications for every teammate.
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
            <SectionTitle>Peer evaluation — your teammates</SectionTitle>
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
