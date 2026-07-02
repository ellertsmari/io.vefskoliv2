"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { GroupProjectDetails, SerializedTeam } from "types/groupTypes";
import {
  MAX_TEAM_IMAGES,
  TEAM_LINK_KEYS,
  TEAM_LINK_LABELS,
  TeamLinkKey,
  EVALUATION_CATEGORY_LABELS,
  EvaluationCategory,
} from "constants/groupWork";
import { updateTeamHub } from "serverActions/groups/updateTeamHub";
import {
  Card,
  SectionTitle,
  MutedText,
  Label,
  Input,
  TextArea,
  PrimaryButton,
  Message,
  MemberRow,
  Avatar,
  AvatarFallback,
  ImagesRow,
  TeamImage,
  Pill,
} from "../../styles";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const Members = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FeedbackEntry = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
`;

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const MemberAvatar = ({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string;
}) =>
  avatarUrl ? (
    <Avatar src={avatarUrl} alt="" />
  ) : (
    <AvatarFallback aria-hidden>{initials(name || "?")}</AvatarFallback>
  );

export const TeamHubTab = ({
  details,
  isTeacher,
  teamOverride,
}: {
  details: GroupProjectDetails;
  isTeacher: boolean;
  teamOverride?: SerializedTeam;
}) => {
  const router = useRouter();
  const team =
    teamOverride ?? details.teams.find((t) => t._id === details.myTeamId);
  const archived = details.project.status === "archived";
  const readOnly = archived && !isTeacher;

  const [name, setName] = useState(team?.name || "");
  const [projectName, setProjectName] = useState(team?.projectName || "");
  const [projectDescription, setProjectDescription] = useState(
    team?.projectDescription || ""
  );
  const [links, setLinks] = useState<Record<TeamLinkKey, string>>(
    () =>
      Object.fromEntries(
        TEAM_LINK_KEYS.map((key) => [key, team?.links[key] || ""])
      ) as Record<TeamLinkKey, string>
  );
  const [images, setImages] = useState<string[]>(() => {
    const list = [...(team?.images || [])];
    while (list.length < MAX_TEAM_IMAGES) list.push("");
    return list;
  });
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!team) {
    return (
      <MutedText>
        You have not been assigned to a team yet — your teachers are putting
        teams together.
      </MutedText>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    const result = await updateTeamHub({
      teamId: team._id,
      name,
      projectName,
      projectDescription,
      links,
      images,
    });
    setSaving(false);
    setFeedback({
      text: result.success ? "Team hub saved!" : result.message,
      error: !result.success,
    });
    if (result.success) router.refresh();
  };

  return (
    <Layout>
      <Card>
        <SectionTitle>Team members</SectionTitle>
        <Members>
          {team.members.map((member) => (
            <MemberRow key={member._id}>
              <MemberAvatar name={member.name} avatarUrl={member.avatarUrl} />
              {member.name}
            </MemberRow>
          ))}
        </Members>
      </Card>

      <form onSubmit={handleSubmit}>
        <Layout>
          <TwoColumns>
            <Card>
              <SectionTitle>Your team</SectionTitle>
              <Label>
                Team name
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={readOnly}
                />
              </Label>
              <Label>
                Project name
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="What are you building?"
                  disabled={readOnly}
                />
              </Label>
              <Label>
                Project description
                <TextArea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your project — idea, target users, scope…"
                  disabled={readOnly}
                />
              </Label>
            </Card>

            <Card>
              <SectionTitle>Links</SectionTitle>
              {TEAM_LINK_KEYS.map((key) => (
                <Label key={key}>
                  {TEAM_LINK_LABELS[key]}
                  <Input
                    type="url"
                    value={links[key]}
                    onChange={(e) =>
                      setLinks((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder="https://…"
                    disabled={readOnly}
                  />
                </Label>
              ))}
            </Card>
          </TwoColumns>

          <Card>
            <SectionTitle>Project images</SectionTitle>
            <MutedText>
              Paste up to {MAX_TEAM_IMAGES} image URLs (group photo,
              screenshots…). They show up in the Teams gallery.
            </MutedText>
            {images.map((url, index) => (
              <Label key={index}>
                Image {index + 1}
                <Input
                  type="url"
                  value={url}
                  onChange={(e) =>
                    setImages((prev) =>
                      prev.map((item, i) => (i === index ? e.target.value : item))
                    )
                  }
                  placeholder="https://…"
                  disabled={readOnly}
                />
              </Label>
            ))}
            <ImagesRow>
              {images
                .filter(Boolean)
                .map((url, index) => (
                  <TeamImage key={index} src={url} alt={`Project image ${index + 1}`} />
                ))}
            </ImagesRow>
          </Card>

          {!readOnly && (
            <Footer>
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save team hub"}
              </PrimaryButton>
              {feedback && (
                <Message $error={feedback.error}>{feedback.text}</Message>
              )}
            </Footer>
          )}
        </Layout>
      </form>

      {details.myTeamFeedback.length > 0 && (
        <Card>
          <SectionTitle>Feedback your team received</SectionTitle>
          {details.myTeamFeedback.map((entry, index) => (
            <FeedbackEntry key={index}>
              <div>
                <Pill>
                  {EVALUATION_CATEGORY_LABELS[
                    entry.category as EvaluationCategory
                  ] || entry.category}
                  {" — "}
                  {entry.score}/10
                </Pill>
              </div>
              {entry.comment && <span>{entry.comment}</span>}
              <MutedText>by {entry.evaluatorName}</MutedText>
            </FeedbackEntry>
          ))}
        </Card>
      )}
    </Layout>
  );
};
