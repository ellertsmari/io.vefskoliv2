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
import { setShowcaseConsent } from "serverActions/groups/setShowcaseConsent";
import { removeTeamImage } from "serverActions/groups/removeTeamImage";
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

const ConsentRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: var(--text-sm);
  cursor: pointer;
  padding: 0.35rem 0;

  input {
    margin-top: 0.15rem;
    flex-shrink: 0;
    cursor: pointer;
  }
`;

const ConsentNote = styled.p`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  margin: 0.5rem 0 0;
  line-height: 1.5;
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

/**
 * Each member's own answer to whether their NAME appears on the public
 * showcase.
 *
 * Kept out of the team-hub form on purpose. That form is read-only once a
 * project is archived, but archived projects stay on the showcase forever, so
 * consent has to remain changeable long after the course ends. It also saves on
 * its own — nobody should have to press "Save team hub" to withdraw.
 *
 * Only names are asked about here. Consent for the team photo is given by
 * choosing to be in the picture when it is taken, and undone by removing it —
 * an earlier version gated the photo on unanimous agreement here, which held
 * whole teams hostage to one person who had simply never seen this card.
 */
const ShowcaseConsentCard = ({
  teamId,
  consent,
}: {
  teamId: string;
  consent: SerializedTeam["showcaseConsent"];
}) => {
  const router = useRouter();
  const [name, setName] = useState(consent.myName);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const save = async (next: boolean) => {
    setName(next);
    setSaving(true);
    const result = await setShowcaseConsent({ teamId, name: next });
    setSaving(false);
    setFeedback(result.success ? "Saved" : result.message);
    if (result.success) router.refresh();
  };

  return (
    <Card>
      <SectionTitle>Your name on the public showcase</SectionTitle>
      <MutedText>
        Your project page is public — anyone can open it without logging in. You
        choose whether your name appears on it, and you can change your mind at
        any time, including after the course has ended.
      </MutedText>

      <ConsentRow>
        <input
          type="checkbox"
          checked={name}
          disabled={saving}
          onChange={(e) => save(e.target.checked)}
        />
        <span>Show my name on our public project page</span>
      </ConsentRow>

      <ConsentNote>
        This is yours alone — it never affects your teammates, and leaving it
        unticked holds nothing up. {consent.nameAgreed} of{" "}
        {consent.memberCount} in your team have chosen to be named so far. You
        do not need to give a reason either way, and nobody is told who answered
        what.
      </ConsentNote>
      {feedback && <ConsentNote>{feedback}</ConsentNote>}
    </Card>
  );
};

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

  // Clearing an image persists immediately rather than waiting for "Save team
  // hub": removal has to work on archived projects too, where the form itself
  // is read-only. Picking a NEW image still goes through the normal save.
  const imageSetters = {
    coverImage: setCoverImage,
    teamPhoto: setTeamPhoto,
    logo: setLogo,
  } as const;

  const handleImageChange =
    (field: keyof typeof imageSetters) => async (value: string) => {
      imageSetters[field](value);
      if (value !== "") return;
      const result = await removeTeamImage({ teamId: team._id, field });
      setFeedback({
        text: result.success ? "Image removed" : result.message,
        error: !result.success,
      });
      if (result.success) router.refresh();
    };

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

      {!isTeacher && (
        <ShowcaseConsentCard teamId={team._id} consent={team.showcaseConsent} />
      )}

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
              — a link you can put in your portfolio or CV. Anyone can open it
              without logging in, so choose images you are happy for the world
              to see.
            </MutedText>
            <TwoColumns>
              <ImageUploadField
                id="cover-image"
                prefix="cover-image"
                label="Cover screenshot"
                description="A crisp shot of your product actually working — this is the big image people see first, both on the showcase grid and at the top of your page."
                value={coverImage}
                onChange={handleImageChange("coverImage")}
                disabled={readOnly}
                canRemove
              />
              <ImageUploadField
                id="team-photo"
                prefix="team-photo"
                label="Team photo — or a second project image"
                description="Take the picture with whoever wants to be in it. Nobody has to be, no reason is needed, and anyone can leave themselves out without saying so. Any team member can remove this photo later, at any time, including after the course ends. Would you rather not put a picture of people on a public page? Upload another image of your project instead — a second screenshot, a mockup, a detail you are proud of."
                value={teamPhoto}
                onChange={handleImageChange("teamPhoto")}
                disabled={readOnly}
                canRemove
              />
              <ImageUploadField
                id="team-logo"
                prefix="team-logo"
                label="Logo (optional)"
                description="Your project's mark, shown next to the title. Square works best."
                value={logo}
                onChange={handleImageChange("logo")}
                disabled={readOnly}
                canRemove
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
