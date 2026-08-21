"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { GroupProjectDetails, SerializedTeam } from "types/groupTypes";
import {
  TEAM_LINK_KEYS,
  TEAM_LINK_LABELS,
  TeamLinkKey,
  categoryLabel,
  disciplineMetaForCategory,
} from "constants/groupWork";
import { ImageUploadField } from "UIcomponents/imageUpload/ImageUploadField";
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
  ScorePill,
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
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: var(--text-sm);
`;

const ShowcaseLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--theme-module3-100);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ShowcaseBanner = styled.div`
  background: linear-gradient(135deg, var(--theme-module3-100) 0%, var(--theme-module3-hover) 100%);
  color: white;
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  box-shadow: 0 8px 20px rgba(101, 99, 235, 0.25);
`;

const BannerText = styled.span`
  font-weight: 600;
  font-size: var(--text-base);
`;

const BannerActions = styled.span`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
`;

const BannerButton = styled.button`
  background: white;
  color: var(--theme-module3-hover);
  border: none;
  border-radius: var(--radius-md);
  padding: 0.45rem 1rem;
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: var(--theme-module3-10);
  }
`;

const BannerLink = styled.a`
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-md);
  padding: 0.45rem 1rem;
  font-size: var(--text-sm);
  font-weight: 700;
  text-decoration: none;

  &:hover {
    border-color: white;
  }
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
  const rubric = details.project.rubric;
  const readOnly = archived && !isTeacher;

  const [name, setName] = useState(team?.name || "");
  const [projectName, setProjectName] = useState(team?.projectName || "");
  const [tagline, setTagline] = useState(team?.tagline || "");
  const [projectDescription, setProjectDescription] = useState(
    team?.projectDescription || ""
  );
  const [links, setLinks] = useState<Record<TeamLinkKey, string>>(
    () =>
      Object.fromEntries(
        TEAM_LINK_KEYS.map((key) => [key, team?.links[key] || ""])
      ) as Record<TeamLinkKey, string>
  );
  const [coverImage, setCoverImage] = useState(team?.coverImage || "");
  const [teamPhoto, setTeamPhoto] = useState(team?.teamPhoto || "");
  const [logo, setLogo] = useState(team?.logo || "");
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // The public page exists once the team has a project name and the project
  // has left formation (getShowcaseTeam enforces the same).
  const showcaseIsLive =
    Boolean(projectName.trim()) && details.project.status !== "formation";
  const showcaseUrl = () =>
    `${window.location.origin}/showcase/${team?._id}`;

  const handleCopyShowcase = async () => {
    await navigator.clipboard.writeText(showcaseUrl());
    setCopied(true);
  };

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
      tagline,
      projectDescription,
      links,
      coverImage,
      teamPhoto,
      logo,
    });
    setSaving(false);
    setFeedback({
      text: result.success ? "Team hub saved!" : result.message,
      error: !result.success,
    });
    if (result.success) {
      setJustSaved(true);
      setCopied(false);
      router.refresh();
    }
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
                Tagline — one-line pitch for the showcase
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Plan your whole week in five minutes"
                  maxLength={140}
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
            <SectionTitle>Showcase images</SectionTitle>
            <MutedText>
              These make your project shine on the{" "}
              <ShowcaseLink
                href={`/showcase/${team._id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                public showcase page ↗
              </ShowcaseLink>{" "}
              — a link you can put in your portfolio or CV.
            </MutedText>
            <TwoColumns>
              <ImageUploadField
                id="cover-image"
                label="Cover screenshot — a crisp shot of your product (the hero image)"
                value={coverImage}
                onChange={setCoverImage}
                disabled={readOnly}
              />
              <ImageUploadField
                id="team-photo"
                label="Team photo — the humans behind the project"
                value={teamPhoto}
                onChange={setTeamPhoto}
                disabled={readOnly}
              />
              <ImageUploadField
                id="team-logo"
                label="Logo — square works best (optional)"
                value={logo}
                onChange={setLogo}
                disabled={readOnly}
              />
            </TwoColumns>
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

          {justSaved && showcaseIsLive && (
            <ShowcaseBanner role="status">
              <BannerText>
                🎉 Your showcase page is live — share it in your portfolio or
                CV!
              </BannerText>
              <BannerActions>
                <BannerButton type="button" onClick={handleCopyShowcase}>
                  {copied ? "Copied!" : "Copy link"}
                </BannerButton>
                <BannerLink
                  href={`/showcase/${team._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View page ↗
                </BannerLink>
              </BannerActions>
            </ShowcaseBanner>
          )}
        </Layout>
      </form>

      {details.myTeamFeedback.length > 0 && (
        <Card>
          <SectionTitle>Feedback your team received</SectionTitle>
          {details.myTeamFeedback.map((entry, index) => {
            const meta = disciplineMetaForCategory(rubric, entry.category);
            return (
              <FeedbackEntry key={index}>
                <div>
                  <ScorePill $color={meta.color} $background={meta.background}>
                    {categoryLabel(rubric, entry.category)}
                    {entry.score !== null && ` — ${entry.score}/10`}
                  </ScorePill>
                </div>
                {entry.comment && <span>{entry.comment}</span>}
                <MutedText>by {entry.evaluatorName}</MutedText>
              </FeedbackEntry>
            );
          })}
        </Card>
      )}
    </Layout>
  );
};
