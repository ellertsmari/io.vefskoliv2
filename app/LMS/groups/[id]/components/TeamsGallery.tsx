"use client";
import styled from "styled-components";
import { GroupProjectDetails } from "types/groupTypes";
import { TEAM_LINK_KEYS, TEAM_LINK_LABELS } from "constants/groupWork";
import {
  Card,
  CardGrid,
  SectionTitle,
  MutedText,
  MemberRow,
  LinksRow,
  ExternalLink,
  TeamImage,
  Pill,
} from "../../styles";
import { MemberAvatar } from "./TeamHubTab";

const TeamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
`;

const ProjectNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TeamLogo = styled.img`
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  object-fit: cover;
`;

const ProjectName = styled.p`
  font-size: var(--text-sm);
  font-weight: 600;
  margin: 0;
  color: var(--theme-module3-100);
`;

const Tagline = styled.p`
  font-size: var(--text-sm);
  font-style: italic;
  margin: 0;
  color: var(--primary-black-60);
`;

const DescriptionText = styled.p`
  font-size: var(--text-sm);
  margin: 0;
  color: var(--primary-black-60);
  white-space: pre-wrap;
`;

const CoverImage = styled(TeamImage)`
  width: 100%;
  height: 160px;
  object-fit: cover;
`;

export const TeamsGallery = ({
  details,
  userId,
}: {
  details: GroupProjectDetails;
  userId: string;
}) => {
  if (details.teams.length === 0) {
    return (
      <MutedText>No teams yet — they will appear here once formed.</MutedText>
    );
  }

  return (
    <CardGrid>
      {details.teams.map((team) => {
        const isMine = team.members.some((member) => member._id === userId);
        return (
          <Card key={team._id}>
            {team.coverImage && (
              <CoverImage src={team.coverImage} alt={`${team.name} project`} />
            )}
            <TeamHeader>
              <SectionTitle>{team.name}</SectionTitle>
              {isMine && <Pill>Your team</Pill>}
            </TeamHeader>
            {team.projectName && (
              <ProjectNameRow>
                {team.logo && <TeamLogo src={team.logo} alt="" />}
                <ProjectName>{team.projectName}</ProjectName>
              </ProjectNameRow>
            )}
            {team.tagline && <Tagline>{team.tagline}</Tagline>}
            {team.projectDescription && (
              <DescriptionText>{team.projectDescription}</DescriptionText>
            )}
            <div>
              {team.members.map((member) => (
                <MemberRow key={member._id}>
                  <MemberAvatar
                    name={member.name}
                    avatarUrl={member.avatarUrl}
                  />
                  {member.name}
                </MemberRow>
              ))}
            </div>
            <LinksRow>
              {TEAM_LINK_KEYS.filter((key) => team.links[key]).map((key) => (
                <ExternalLink
                  key={key}
                  href={team.links[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {TEAM_LINK_LABELS[key]} ↗
                </ExternalLink>
              ))}
            </LinksRow>
          </Card>
        );
      })}
    </CardGrid>
  );
};
