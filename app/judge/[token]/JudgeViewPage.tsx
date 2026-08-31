"use client";
import { useState } from "react";
import styled from "styled-components";
import { JudgeView } from "types/groupTypes";
import {
  JUDGE_FOCUS_LABELS,
  TEAM_LINK_KEYS,
  TEAM_LINK_LABELS,
  rubricForProject,
} from "constants/groupWork";
import {
  setJudgeShowcaseConsent,
  submitJudgeEvaluation,
} from "serverActions/groups/judgeActions";
import {
  PageContainer,
  PageHeader,
  PageTitle,
  SectionTitle,
  MutedText,
  Card,
  ChipRow,
  SelectableChip,
  ExternalLink,
  LinksRow,
  Pill,
  Message,
} from "../../LMS/groups/styles";
import { TeamEvalForm } from "../../LMS/groups/[id]/components/TeamEvalForm";

const ConsentCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ConsentRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: var(--text-sm);
  cursor: pointer;
`;

const Wrapper = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const TeamLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const JudgeViewPage = ({
  view,
  token,
}: {
  view: JudgeView;
  token: string;
}) => {
  const { project, teams, judge } = view;
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    teams[0]?._id ?? null
  );
  const selectedTeam = teams.find((team) => team._id === selectedTeamId);
  const [nameConsent, setNameConsent] = useState(judge.showcaseNameConsent);
  const [consentMessage, setConsentMessage] = useState<string | null>(null);

  const toggleNameConsent = async (allow: boolean) => {
    setNameConsent(allow);
    setConsentMessage(null);
    const result = await setJudgeShowcaseConsent({ token, allow });
    if (result.success) {
      setConsentMessage(result.message ?? null);
    } else {
      // Put the checkbox back where it was rather than showing an answer that
      // was never stored.
      setNameConsent(!allow);
      setConsentMessage(result.message);
    }
  };

  return (
    <Wrapper>
      <PageContainer>
        <PageHeader>
          <div>
            <PageTitle>{project.title}</PageTitle>
            <MutedText>
              Welcome, {judge.name} — you are judging:{" "}
              {JUDGE_FOCUS_LABELS[judge.focus]}. Your grades weigh like teacher
              grades.
            </MutedText>
          </div>
        </PageHeader>

        <ConsentCard>
          <ConsentRow>
            <input
              type="checkbox"
              checked={nameConsent}
              onChange={(event) => toggleNameConsent(event.target.checked)}
            />
            <span>
              <strong>May we use your name?</strong> Teams can choose a few
              comments from their feedback to show on their public project
              page. Tick this and yours will be signed{" "}
              <em>{judge.name}, industry judge</em> — feedback from a named
              professional makes the showcase far more trustworthy for the
              people who read it. Leave it unticked and your comments appear as{" "}
              <em>An industry judge</em>. Scores are never published, and you
              can change this at any time.
            </span>
          </ConsentRow>
          {consentMessage && <Message>{consentMessage}</Message>}
        </ConsentCard>

        <SectionTitle>Pick a team</SectionTitle>
        <ChipRow>
          {teams.map((team) => {
            const done = (view.myEvaluations[team._id]?.length ?? 0) > 0;
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

        {teams.length === 0 && (
          <MutedText>No teams have been set up yet.</MutedText>
        )}

        {selectedTeam && (
          <TeamLayout>
            <Card>
              <SectionTitle>
                {selectedTeam.projectName || selectedTeam.name}
              </SectionTitle>
              {selectedTeam.projectDescription && (
                <MutedText>{selectedTeam.projectDescription}</MutedText>
              )}
              <LinksRow>
                {TEAM_LINK_KEYS.filter((key) => selectedTeam.links[key]).map(
                  (key) => (
                    <ExternalLink
                      key={key}
                      href={selectedTeam.links[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {TEAM_LINK_LABELS[key]} ↗
                    </ExternalLink>
                  )
                )}
                {TEAM_LINK_KEYS.every((key) => !selectedTeam.links[key]) && (
                  <MutedText>
                    This team has not submitted any links yet.
                  </MutedText>
                )}
              </LinksRow>
              <ChipRow>
                {selectedTeam.members.map((member) => (
                  <Pill key={member._id}>{member.name}</Pill>
                ))}
              </ChipRow>
            </Card>

            <TeamEvalForm
              key={selectedTeam._id}
              heading={`Evaluate ${selectedTeam.name}`}
              rubric={rubricForProject(project.rubric)}
              existing={view.myEvaluations[selectedTeam._id] || []}
              focus={judge.focus}
              onSubmit={(data) =>
                submitJudgeEvaluation({
                  token,
                  teamId: selectedTeam._id,
                  ...data,
                })
              }
            />
          </TeamLayout>
        )}
      </PageContainer>
    </Wrapper>
  );
};
