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
  ImagesRow,
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

const ProjectName = styled.p`
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: var(--theme-module3-100);
`;

const DescriptionText = styled.p`
  font-size: 0.9rem;
  margin: 0;
  color: #495057;
  white-space: pre-wrap;
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
            <TeamHeader>
              <SectionTitle>{team.name}</SectionTitle>
              {isMine && <Pill>Your team</Pill>}
            </TeamHeader>
            {team.projectName && <ProjectName>{team.projectName}</ProjectName>}
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
            {team.images.length > 0 && (
              <ImagesRow>
                {team.images.map((url, index) => (
                  <TeamImage
                    key={index}
                    src={url}
                    alt={`${team.name} project image ${index + 1}`}
                  />
                ))}
              </ImagesRow>
            )}
          </Card>
        );
      })}
    </CardGrid>
  );
};
