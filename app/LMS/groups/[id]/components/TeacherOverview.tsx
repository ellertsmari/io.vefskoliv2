"use client";
import styled from "styled-components";
import { GroupProjectDetails, SerializedTeam } from "types/groupTypes";
import {
  TEAM_LINK_KEYS,
  TEAM_LINK_LABELS,
  categoryLabel,
  disciplineMetaForCategory,
} from "constants/groupWork";
import {
  Card,
  CardGrid,
  SectionTitle,
  MutedText,
  StatsBar,
  StatCard,
  StatValue,
  StatLabel,
  MemberRow,
  LinksRow,
  ExternalLink,
  Pill,
  ScorePill,
} from "../../styles";
import { MemberAvatar } from "./TeamHubTab";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TeamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
`;

const CompletenessBadge = styled.span<{ $ratio: number }>`
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  color: white;
  background: ${({ $ratio }) =>
    $ratio >= 0.7
      ? "var(--error-success-100)"
      : $ratio >= 0.3
        ? "var(--error-warning-100)"
        : "var(--error-failure-100)"};
`;

const PrefBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-left: auto;
`;

// Hub completeness: links + description + cover screenshot out of 7.
const completeness = (team: SerializedTeam) => {
  let filled = 0;
  const total = TEAM_LINK_KEYS.length + 2;
  for (const key of TEAM_LINK_KEYS) {
    if (team.links[key]) filled++;
  }
  if (team.projectDescription) filled++;
  if (team.coverImage) filled++;
  return { filled, total, ratio: filled / total };
};

export const TeacherOverview = ({
  details,
}: {
  details: GroupProjectDetails;
}) => {
  const students = details.students || [];
  const assigned = students.filter((student) => student.teamId).length;
  const withPrefs = students.filter((student) => student.preferences).length;
  const prefByUser = new Map(
    students.map((student) => [student._id, student.preferences])
  );

  return (
    <Layout>
      <StatsBar>
        <StatCard>
          <StatValue>{students.length}</StatValue>
          <StatLabel>Students</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{assigned}</StatValue>
          <StatLabel>Assigned</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{students.length - assigned}</StatValue>
          <StatLabel>Unassigned</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{withPrefs}</StatValue>
          <StatLabel>Filled preferences</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{details.teams.length}</StatValue>
          <StatLabel>Teams</StatLabel>
        </StatCard>
      </StatsBar>

      {details.teams.length === 0 ? (
        <MutedText>
          No teams yet — create them on the Assignment tab.
        </MutedText>
      ) : (
        <CardGrid>
          {details.teams.map((team) => {
            const { filled, total, ratio } = completeness(team);
            const summary = details.teamEvalSummaries?.[team._id];
            return (
              <Card key={team._id}>
                <TeamHeader>
                  <SectionTitle>{team.name}</SectionTitle>
                  <CompletenessBadge
                    $ratio={ratio}
                    title="Filled project info (links, description, images)"
                  >
                    {filled}/{total}
                  </CompletenessBadge>
                </TeamHeader>
                {team.projectName && <MutedText>{team.projectName}</MutedText>}
                <div>
                  {team.members.length === 0 && (
                    <MutedText>No members</MutedText>
                  )}
                  {team.members.map((member) => {
                    const prefs = prefByUser.get(member._id);
                    return (
                      <MemberRow key={member._id}>
                        <MemberAvatar
                          name={member.name}
                          avatarUrl={member.avatarUrl}
                        />
                        {member.name}
                        {prefs && (
                          <PrefBadges>
                            {prefs.ambition && <Pill>{prefs.ambition}</Pill>}
                            {prefs.focus.map((item) => (
                              <Pill key={item}>{item}</Pill>
                            ))}
                          </PrefBadges>
                        )}
                      </MemberRow>
                    );
                  })}
                </div>
                <LinksRow>
                  {TEAM_LINK_KEYS.filter((key) => team.links[key]).map(
                    (key) => (
                      <ExternalLink
                        key={key}
                        href={team.links[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {TEAM_LINK_LABELS[key]} ↗
                      </ExternalLink>
                    )
                  )}
                </LinksRow>
                {summary && Object.keys(summary).length > 0 && (
                  <LinksRow>
                    {Object.entries(summary).map(([category, bucket]) => {
                      const meta = disciplineMetaForCategory(
                        details.project.rubric,
                        category
                      );
                      return (
                        <ScorePill
                          key={category}
                          $color={meta.color}
                          $background={meta.background}
                        >
                          {categoryLabel(details.project.rubric, category)}:{" "}
                          {bucket.avg} ({bucket.count})
                        </ScorePill>
                      );
                    })}
                  </LinksRow>
                )}
              </Card>
            );
          })}
        </CardGrid>
      )}
    </Layout>
  );
};
