"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  GroupProjectDetails,
  SerializedTeam,
  StudentFeedbackEntry,
} from "types/groupTypes";
import {
  MAX_SHOWCASE_QUOTES,
  TEAM_LINK_KEYS,
  TEAM_LINK_LABELS,
  TeamLinkKey,
  categoryLabel,
  disciplineMetaForCategory,
  rubricForProject,
} from "constants/groupWork";
import { ImageUploadField } from "UIcomponents/imageUpload/ImageUploadField";
import { useFormDraft } from "utils/hooks/useStorage";
import { DraftNotice } from "UIcomponents/draftNotice/DraftNotice";
import { updateTeamHub } from "serverActions/groups/updateTeamHub";
import { setShowcaseConsent } from "serverActions/groups/setShowcaseConsent";
import { setShowcaseQuotes } from "serverActions/groups/setShowcaseQuotes";
import { setTeamImage } from "serverActions/groups/setTeamImage";
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
  flex-wrap: wrap;
`;

/**
 * Follows the form down the page while there is something unsaved, so the
 * save button is never three screens away from the field being edited — and
 * so leaving the step with unsaved text is a choice, not an accident.
 */
const SaveBar = styled.div<{ $dirty: boolean }>`
  position: sticky;
  bottom: 0.75rem;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  background: var(--primary-white);
  border: 1px solid
    ${({ $dirty }) =>
      $dirty ? "var(--error-warning-100)" : "var(--primary-black-10)"};
  box-shadow: ${({ $dirty }) =>
    $dirty ? "0 6px 20px rgba(0, 0, 0, 0.12)" : "none"};
`;

const DirtyText = styled.span`
  font-size: var(--text-sm);
  font-weight: 600;
`;

const Required = styled.span`
  color: var(--error-failure-100);
  margin-left: 0.2rem;
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

const LockedCard = styled.div`
  border: 1px dashed var(--primary-black-40, var(--primary-black-10));
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Checklist = styled.ul`
  margin: 0;
  padding-left: 1.2rem;
  font-size: var(--text-sm);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ChecklistItem = styled.li<{ $done: boolean }>`
  color: ${({ $done }) =>
    $done ? "var(--error-success-100)" : "var(--primary-black-60)"};
`;

const EvaluatorBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0.8rem 0;
`;

const EvaluatorName = styled.h4`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 700;
`;

const QuoteToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  cursor: pointer;
`;

const GradeRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--primary-black-10);
  font-size: var(--text-sm);
`;

const GradeValue = styled.span`
  font-weight: 700;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;

const BigGrade = styled.p`
  margin: 0;
  font-size: var(--text-2xl, 2rem);
  font-weight: 800;
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

const ShowcaseStatus = styled.div<{ $live: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: ${({ $live }) =>
    $live ? "var(--theme-module3-10)" : "var(--primary-black-5)"};
  border: 1px solid
    ${({ $live }) =>
      $live ? "var(--theme-module3-60)" : "var(--primary-black-10)"};
`;

const StatusText = styled.span`
  font-weight: 600;
  flex: 1 1 auto;
`;

const SmallButton = styled.button`
  background: var(--primary-white);
  color: var(--primary-black-100);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.4rem 0.9rem;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: var(--primary-black-100);
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

const FinePrint = styled.details`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  line-height: 1.5;

  summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--primary-black-100);
    font-size: var(--text-sm);
  }

  p {
    margin: 0.5rem 0 0;
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

/**
 * Each member's own answer to whether their NAME appears on the public
 * showcase. Saves on its own the moment it is ticked — nobody should have to
 * press "Save" to withdraw — and keeps working after the project completes,
 * because the showcase page stays up.
 *
 * Only names are asked about. Consent for the team photo is given by choosing
 * to be in the picture, and undone by removing it.
 */
const ShowcaseConsent = ({
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
    <div>
      <ConsentRow>
        <input
          type="checkbox"
          checked={name}
          disabled={saving}
          onChange={(e) => save(e.target.checked)}
        />
        <span>
          Show my name on our public project page
          {feedback && <MutedText as="span"> · {feedback}</MutedText>}
        </span>
      </ConsentRow>
      <FinePrint>
        <summary>About names and photos on the public page</summary>
        <p>
          The page is public: anyone can open it without logging in. Your
          name is yours alone to add or remove, at any time, including after
          the course ends. It never affects your teammates and holds nothing
          up. {consent.nameAgreed} of {consent.memberCount} in your team have
          chosen to be named so far; nobody is told who answered what.
        </p>
        <p>
          The team photo works the same way: be in it if you want to, and any
          team member can remove it at any time without giving a reason. If
          you would rather not have people in the picture, use a second
          project image instead.
        </p>
      </FinePrint>
    </div>
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
  const readOnly = archived && !isTeacher;

  const savedText = {
    name: team?.name || "",
    projectName: team?.projectName || "",
    tagline: team?.tagline || "",
    projectDescription: team?.projectDescription || "",
    links: Object.fromEntries(
      TEAM_LINK_KEYS.map((key) => [key, team?.links[key] || ""])
    ) as Record<TeamLinkKey, string>,
  };

  const [name, setName] = useState(savedText.name);
  const [projectName, setProjectName] = useState(savedText.projectName);
  const [tagline, setTagline] = useState(savedText.tagline);
  const [projectDescription, setProjectDescription] = useState(
    savedText.projectDescription
  );
  const [links, setLinks] = useState<Record<TeamLinkKey, string>>(
    savedText.links
  );
  const [coverImage, setCoverImage] = useState(team?.coverImage || "");
  const [teamPhoto, setTeamPhoto] = useState(team?.teamPhoto || "");
  const [logo, setLogo] = useState(team?.logo || "");
  // Text lives in the draft; images are stored the moment they are picked.
  const draft = useFormDraft(
    team ? `team-hub:${team._id}` : null,
    { name, projectName, tagline, projectDescription, links },
    (saved) => {
      setName(saved.name);
      setProjectName(saved.projectName);
      setTagline(saved.tagline);
      setProjectDescription(saved.projectDescription);
      setLinks(saved.links);
    }
  );
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [imageFeedback, setImageFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const dirty =
    JSON.stringify({ name, projectName, tagline, projectDescription, links }) !==
    JSON.stringify(savedText);

  // The public page exists once the team has a SAVED project name and the
  // project has left formation (getShowcaseTeam enforces the same).
  const showcaseIsLive =
    Boolean(savedText.projectName.trim()) &&
    details.project.status !== "formation";
  const showcasePath = team ? `/showcase/${team._id}` : "";

  const handleCopyShowcase = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}${showcasePath}`
    );
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

  const imageSetters = {
    coverImage: setCoverImage,
    teamPhoto: setTeamPhoto,
    logo: setLogo,
  } as const;

  // Picking or removing an image saves at once: what the field shows is what
  // is stored, so nothing is lost by leaving the step without pressing Save.
  const handleImageChange =
    (field: keyof typeof imageSetters) => async (value: string) => {
      imageSetters[field](value);
      setImageFeedback(null);
      const result = await setTeamImage({ teamId: team._id, field, value });
      setImageFeedback({
        text: result.success
          ? value === ""
            ? "Image removed"
            : "Image saved"
          : result.message,
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
    });
    setSaving(false);
    setFeedback({
      text: result.success ? "Saved" : result.message,
      error: !result.success,
    });
    if (result.success) {
      draft.clear();
      setCopied(false);
      router.refresh();
    }
  };

  return (
    <Layout>
      <DraftNotice restored={draft.restored} onDiscard={draft.discard} />
      {/* Once there is feedback (or a grade), it is the reason a student opens
          this step at all — so it goes above the hub form. */}
      {team._id === details.myTeamId && (
        <TeamFeedbackSection details={details} teamId={team._id} />
      )}

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
              <SectionTitle>Your project</SectionTitle>
              <Label>
                Team name
                <Required aria-hidden>*</Required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  aria-required
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
                Tagline — one line for the showcase
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

          {!readOnly && (
            <SaveBar $dirty={dirty}>
              <PrimaryButton type="submit" disabled={saving || !dirty}>
                {saving ? "Saving…" : "Save"}
              </PrimaryButton>
              {dirty && !saving && <DirtyText>Unsaved changes</DirtyText>}
              {feedback && (
                <Message $error={feedback.error}>{feedback.text}</Message>
              )}
              {!dirty && !feedback && (
                <MutedText>Images save on their own when you pick them.</MutedText>
              )}
            </SaveBar>
          )}
        </Layout>
      </form>

      <Card>
        <SectionTitle>Public showcase</SectionTitle>
        <ShowcaseStatus $live={showcaseIsLive} role="status">
          <StatusText>
            {showcaseIsLive
              ? "Your project page is live — a link for your portfolio or CV."
              : details.project.status === "formation"
                ? "Your project page goes live once the project starts and you have saved a project name."
                : "Your project page goes live once you save a project name above."}
          </StatusText>
          {showcaseIsLive && (
            <>
              <SmallButton type="button" onClick={handleCopyShowcase}>
                {copied ? "Copied!" : "Copy link"}
              </SmallButton>
              <ShowcaseLink
                href={showcasePath}
                target="_blank"
                rel="noopener noreferrer"
              >
                View page ↗
              </ShowcaseLink>
            </>
          )}
        </ShowcaseStatus>

        {!isTeacher && (
          <ShowcaseConsent teamId={team._id} consent={team.showcaseConsent} />
        )}

        <MutedText>
          Images for the page. Anyone can see them without logging in, and
          each one saves as soon as it is picked.
        </MutedText>
        <TwoColumns>
          <ImageUploadField
            id="cover-image"
            prefix="cover-image"
            label="Cover screenshot"
            description="A crisp shot of your product working — the first thing people see, on the grid and at the top of your page."
            value={coverImage}
            onChange={handleImageChange("coverImage")}
            disabled={readOnly}
            canRemove
          />
          <ImageUploadField
            id="team-photo"
            prefix="team-photo"
            label="Team photo — or a second project image"
            description="Whoever wants to be in it. Any member can remove it later, at any time."
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
        {imageFeedback && (
          <Message $error={imageFeedback.error}>{imageFeedback.text}</Message>
        )}
      </Card>
    </Layout>
  );
};

/**
 * Feedback is grouped by who wrote it: the people who came to judge are named,
 * and every classmate arrives in one unnamed block. Teams then choose which
 * comments go on their public page.
 */
type FeedbackGroup = {
  key: string;
  label: string;
  entries: StudentFeedbackEntry[];
};

const groupFeedback = (entries: StudentFeedbackEntry[]): FeedbackGroup[] => {
  const named = new Map<string, FeedbackGroup>();
  const students: StudentFeedbackEntry[] = [];

  for (const entry of entries) {
    if (entry.evaluatorKind === "student" || !entry.evaluatorName) {
      students.push(entry);
      continue;
    }
    const key = `${entry.evaluatorKind}:${entry.evaluatorName}`;
    const group = named.get(key) ?? {
      key,
      label:
        entry.evaluatorKind === "judge"
          ? `${entry.evaluatorName} — industry judge`
          : `${entry.evaluatorName} — teacher`,
      entries: [],
    };
    group.entries.push(entry);
    named.set(key, group);
  }

  const groups = [...named.values()];
  if (students.length > 0) {
    groups.push({
      key: "students",
      label: "Classmates",
      entries: students,
    });
  }
  return groups;
};

const TeamFeedbackSection = ({
  details,
  teamId,
}: {
  details: GroupProjectDetails;
  teamId: string;
}) => {
  const router = useRouter();
  const rubric = details.project.rubric;
  const unlock = details.myFeedbackUnlock;
  const [quotes, setQuotes] = useState<string[]>(details.myShowcaseQuotes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const evaluationStarted =
    details.project.teamEvalOpen || details.project.peerEvalOpen;

  // Before anything is open there is nothing to be waiting for, so no card.
  if (!unlock.unlocked) {
    if (!evaluationStarted) return null;
    return (
      <Card>
        <SectionTitle>Your team&apos;s feedback is waiting</SectionTitle>
        <LockedCard>
          <MutedText>
            It opens as soon as you have handed in your own evaluations — you
            do not have to wait for the rest of the class.
          </MutedText>
          <Checklist>
            {details.project.teamEvalOpen && (
              <ChecklistItem $done={unlock.teamsToScore === 0}>
                {unlock.teamsToScore === 0
                  ? "Every other team scored ✓"
                  : `Score the presentations — ${unlock.teamsToScore} more team${
                      unlock.teamsToScore === 1 ? "" : "s"
                    }`}
              </ChecklistItem>
            )}
            {details.project.peerEvalOpen && (
              <ChecklistItem $done={!unlock.peerEvalPending}>
                {unlock.peerEvalPending
                  ? "Rate your teammates — not handed in yet"
                  : "Teammates rated ✓"}
              </ChecklistItem>
            )}
          </Checklist>
        </LockedCard>
      </Card>
    );
  }

  const groups = groupFeedback(details.myTeamFeedback);
  const grade = details.myGrade;
  const gradeRows = grade
    ? rubricForProject(rubric).filter(
        (item) => typeof grade.categories[item.key] === "number"
      )
    : [];

  if (groups.length === 0 && gradeRows.length === 0) {
    return (
      <Card>
        <SectionTitle>Feedback your team received</SectionTitle>
        <MutedText>
          Nothing has been written about your project yet — it appears here as
          it arrives.
        </MutedText>
      </Card>
    );
  }

  const toggleQuote = (id: string) => {
    setMessage(null);
    setQuotes((previous) =>
      previous.includes(id)
        ? previous.filter((quote) => quote !== id)
        : previous.length >= MAX_SHOWCASE_QUOTES
          ? previous
          : [...previous, id]
    );
  };

  const saveQuotes = async () => {
    setSaving(true);
    setMessage(null);
    const result = await setShowcaseQuotes({ teamId, evaluationIds: quotes });
    setSaving(false);
    setMessage({
      text: result.message || (result.success ? "Saved" : "Failed"),
      error: !result.success,
    });
    if (result.success) router.refresh();
  };

  return (
    <>
      {grade && gradeRows.length > 0 && (
        <Card>
          <SectionTitle>Your grade</SectionTitle>
          <BigGrade>{grade.grade} / 10</BigGrade>
          <MutedText>
            Your team&apos;s presentation result, adjusted by the contribution
            and teamwork figures your teachers confirmed for you. An average
            team member keeps the team&apos;s result.
          </MutedText>
          {gradeRows.map((item) => (
            <GradeRow key={item.key}>
              <span>{item.title}</span>
              <GradeValue>{grade.categories[item.key]} / 10</GradeValue>
            </GradeRow>
          ))}
        </Card>
      )}

      {!grade && details.project.gradesReleased && (
        <Card>
          <SectionTitle>Your grade</SectionTitle>
          <MutedText>
            Your teachers have not confirmed your peer evaluation yet, so your
            grade is not final. It appears here as soon as they have.
          </MutedText>
        </Card>
      )}

      <Card>
        <SectionTitle>Feedback your team received</SectionTitle>
        <MutedText>
          Tick up to {MAX_SHOWCASE_QUOTES} comments to show on your public
          showcase page. Only the words are published — never a score, and
          never a classmate&apos;s name.
        </MutedText>

        {groups.map((group) => (
          <EvaluatorBlock key={group.key}>
            <EvaluatorName>{group.label}</EvaluatorName>
            {group.entries.map((entry) => {
              const meta = disciplineMetaForCategory(rubric, entry.category);
              const chosen = quotes.includes(entry._id);
              return (
                <FeedbackEntry key={entry._id}>
                  <div>
                    <ScorePill
                      $color={meta.color}
                      $background={meta.background}
                    >
                      {categoryLabel(rubric, entry.category)}
                    </ScorePill>
                  </div>
                  <span>{entry.comment}</span>
                  <QuoteToggle>
                    <input
                      type="checkbox"
                      checked={chosen}
                      disabled={
                        !chosen && quotes.length >= MAX_SHOWCASE_QUOTES
                      }
                      onChange={() => toggleQuote(entry._id)}
                    />
                    Show on our showcase page
                  </QuoteToggle>
                </FeedbackEntry>
              );
            })}
          </EvaluatorBlock>
        ))}

        <Footer>
          <PrimaryButton type="button" onClick={saveQuotes} disabled={saving}>
            {saving
              ? "Saving…"
              : `Save showcase selection (${quotes.length}/${MAX_SHOWCASE_QUOTES})`}
          </PrimaryButton>
          {message && <Message $error={message.error}>{message.text}</Message>}
        </Footer>
      </Card>
    </>
  );
};
