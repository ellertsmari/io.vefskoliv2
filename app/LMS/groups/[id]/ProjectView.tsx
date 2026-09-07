"use client";
import { useMemo, useState } from "react";
import styled from "styled-components";
import MarkdownReader from "UIcomponents/markdown/reader";
import {
  EvaluationReports,
  GroupProjectDetails,
  SerializedJudgeInvitation,
} from "types/groupTypes";
import {
  DISCIPLINE_META,
  PROJECT_STATUS_LABELS,
  rubricForProject,
} from "constants/groupWork";
import {
  PageContainer,
  PageHeader,
  PageTitle,
  Card,
  MutedText,
  StatusChip,
  TabBar,
  TabButton,
  StepPanel,
  SectionTitle,
  ScorePill,
} from "../styles";
import { PreferencesForm } from "./components/PreferencesForm";
import { TeamHubTab } from "./components/TeamHubTab";
import { TeamsGallery } from "./components/TeamsGallery";
import { PresentationsStep, TeammatesStep } from "./components/EvaluateTab";
import { TeacherOverview } from "./components/TeacherOverview";
import { AssignmentBoard } from "./components/AssignmentBoard";
import { TeacherEvaluations } from "./components/TeacherEvaluations";
import { ProjectSettings } from "./components/ProjectSettings";
import { Stepper, type Step } from "./components/Stepper";

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Description = styled(Card)`
  padding: 1rem 1.5rem;
`;

/** The student's own presentation slot, where they will look for it: the header. */
const SlotLine = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
`;

const RubricRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.35rem 0.75rem;
  align-items: baseline;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--primary-black-10);
  font-size: var(--text-sm);

  &:last-of-type {
    border-bottom: none;
  }
`;

const RubricTitle = styled.span`
  font-weight: 600;
`;

type Props = {
  details: GroupProjectDetails;
  reports: EvaluationReports | null;
  judges: SerializedJudgeInvitation[];
  isTeacher: boolean;
  userId: string;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const STEP_IDS = [
  "preferences",
  "brief",
  "team",
  "teams",
  "presentations",
  "teammates",
] as const;
type StepId = (typeof STEP_IDS)[number];

/**
 * What the rubric means for the student, on the brief where they will read it
 * before the work starts rather than inside a scoring form afterwards.
 */
const HowYouAreGraded = ({ details }: { details: GroupProjectDetails }) => {
  const { project } = details;
  const rubric = rubricForProject(project.rubric);
  const panelPercent = Math.round(project.panelWeight * 100);
  return (
    <Card>
      <SectionTitle>How you will be graded</SectionTitle>
      <MutedText>
        Every team is scored 0–10 on each row below, by the teachers, any
        invited judges, and the other students.{" "}
        {panelPercent === 100
          ? "Only the teachers' and judges' scores count towards the grade; the students' scores are feedback."
          : `The teachers and judges carry ${panelPercent}% of each score, the student audience the other ${100 - panelPercent}%.`}
      </MutedText>
      <div>
        {rubric.map((item) => {
          const meta = DISCIPLINE_META[item.discipline ?? "general"];
          return (
            <RubricRow key={item.key}>
              <ScorePill $color={meta.color} $background={meta.background}>
                {meta.label}
              </ScorePill>
              <span>
                <RubricTitle>{item.title}</RubricTitle>
                {item.description && (
                  <MutedText as="span"> — {item.description}</MutedText>
                )}
              </span>
            </RubricRow>
          );
        })}
      </div>
      <MutedText>
        Your own grade is the team&apos;s result adjusted by the contribution
        and teamwork figures your teachers confirm from the teammate ratings.
        An average team member keeps the team&apos;s result.
      </MutedText>
    </Card>
  );
};

export const ProjectView = ({
  details,
  reports,
  judges,
  isTeacher,
  userId,
}: Props) => {
  const { project, myTeamId, teams } = details;

  const teacherTabs = ["Overview", "Assignment", "Evaluations", "Settings"];

  const mySlot = myTeamId
    ? project.presentationSlots.find((slot) => slot.team === myTeamId) ?? null
    : null;

  /**
   * The student's route through the project. Every step is listed whether or
   * not it is open yet — a locked step with a reason tells you what happens
   * next, which a hidden one cannot.
   */
  const { steps, defaultStep } = useMemo(() => {
    // The server withholds the brief until the formation questions are all
    // answered, so this flag doubles as "step one is finished".
    const preferencesDone = !project.descriptionLocked;
    const inFormation = project.status === "formation";
    const unlock = details.myFeedbackUnlock;
    const otherTeamCount = teams.filter((team) => team._id !== myTeamId).length;
    const presentationsDone =
      otherTeamCount > 0 &&
      Object.keys(details.myTeamEvaluations).length >= otherTeamCount;
    const teammatesDone = details.myPeerEvaluations.length > 0;
    const presentationDay = project.presentationDate
      ? formatDay(project.presentationDate)
      : null;
    const presentationsPassed =
      !!project.presentationDate &&
      new Date(project.presentationDate).getTime() < Date.now();

    const list: Step[] = [];

    if (inFormation) {
      list.push({
        id: "preferences",
        label: "Your preferences",
        done: preferencesDone,
        hint: preferencesDone
          ? "Answered — you can still change them"
          : "Tell your teachers how you want to work",
      });
    }

    list.push({
      id: "brief",
      label: "Project brief",
      locked: project.descriptionLocked,
      hint: project.descriptionLocked
        ? "Unlocks when your preferences are in"
        : "What you are building, and how it is graded",
    });

    list.push({
      id: "team",
      label: "Your team",
      locked: !myTeamId,
      hint: myTeamId
        ? "Your team, its workspace and your feedback"
        : "Your teachers are still putting teams together",
    });

    list.push({
      id: "teams",
      label: "All teams",
      locked: teams.length === 0,
      hint: teams.length === 0 ? "Nothing to see until teams exist" : "Everyone on the project",
    });

    if (!inFormation) {
      list.push({
        id: "presentations",
        label: "Score the presentations",
        locked: !project.teamEvalOpen,
        done: presentationsDone,
        hint: project.teamEvalOpen
          ? presentationsDone
            ? "All teams scored — you can still adjust"
            : unlock.teamsToScore > 0
              ? `${unlock.teamsToScore} team${unlock.teamsToScore === 1 ? "" : "s"} still to score`
              : "Open now"
          : presentationsDone
            ? "Closed · handed in"
            : presentationsPassed
              ? "Closed"
              : presentationDay
                ? `Opens on presentation day, ${presentationDay}`
                : "Opens on presentation day",
      });

      list.push({
        id: "teammates",
        label: "Rate your teammates",
        locked: !project.peerEvalOpen || !myTeamId,
        done: teammatesDone,
        hint:
          project.peerEvalOpen && myTeamId
            ? teammatesDone
              ? "Handed in — you can still change it"
              : "Open now · only your teachers see this"
            : teammatesDone
              ? "Closed · handed in"
              : presentationsPassed
                ? "Closed"
                : "Opens once every team has presented",
      });
    }

    // Land on whatever needs the student most: an open evaluation they have
    // not handed in, then the formation form, then their team.
    const pick = (): StepId => {
      if (inFormation && !preferencesDone) return "preferences";
      if (project.teamEvalOpen && unlock.teamsToScore > 0) return "presentations";
      if (project.peerEvalOpen && myTeamId && unlock.peerEvalPending) {
        return "teammates";
      }
      if (inFormation) return "brief";
      if (myTeamId) return "team";
      return "brief";
    };

    return { steps: list, defaultStep: pick() };
  }, [project, details, teams, myTeamId]);

  const tabs = isTeacher ? teacherTabs : [];

  const [activeTab, setActiveTab] = useState<string>(
    isTeacher ? teacherTabs[0] : defaultStep
  );
  const available = isTeacher
    ? teacherTabs
    : steps.filter((step) => !step.locked).map((step) => step.id);
  const currentTab = available.includes(activeTab)
    ? activeTab
    : available.includes(defaultStep)
      ? defaultStep
      : available[0];

  return (
    <PageContainer $width="wide">
      <PageHeader>
        <HeaderInfo>
          <TitleRow>
            <PageTitle>{project.title}</PageTitle>
            <StatusChip $status={project.status}>
              {PROJECT_STATUS_LABELS[project.status]}
            </StatusChip>
          </TitleRow>
          <MutedText>
            {formatDate(project.startDate)} – {formatDate(project.endDate)}
            {project.presentationDate &&
              ` · Presentations ${formatDate(project.presentationDate)}`}
          </MutedText>
          {!isTeacher && mySlot && project.presentationDate && (
            <SlotLine>
              Your presentation: {formatDay(project.presentationDate)},{" "}
              {mySlot.startTime}–{mySlot.endTime}
            </SlotLine>
          )}
        </HeaderInfo>
      </PageHeader>

      {/* Teachers manage a project; students walk through one. Tools are not a
          sequence, so only the student side gets the stepper. */}
      {isTeacher ? (
        <TabBar role="tablist">
          {tabs.map((tab) => (
            <TabButton
              key={tab}
              role="tab"
              aria-selected={tab === currentTab}
              $active={tab === currentTab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </TabButton>
          ))}
        </TabBar>
      ) : (
        <Stepper steps={steps} activeId={currentTab} onSelect={setActiveTab} />
      )}

      {!isTeacher && (
        <StepPanel>
          {currentTab === "preferences" && (
            <PreferencesForm
              details={details}
              onSaved={() => setActiveTab("brief")}
            />
          )}
          {currentTab === "brief" && (
            <>
              {project.description ? (
                <Description>
                  <MarkdownReader>{project.description}</MarkdownReader>
                </Description>
              ) : (
                <MutedText>
                  Your teachers haven&apos;t written the brief yet — it will
                  appear here.
                </MutedText>
              )}
              <HowYouAreGraded details={details} />
            </>
          )}
          {currentTab === "team" && (
            <TeamHubTab details={details} isTeacher={false} />
          )}
          {currentTab === "teams" && (
            <TeamsGallery details={details} userId={userId} />
          )}
          {currentTab === "presentations" && (
            <PresentationsStep details={details} />
          )}
          {currentTab === "teammates" && (
            <TeammatesStep details={details} userId={userId} />
          )}
        </StepPanel>
      )}

      {currentTab === "Overview" && <TeacherOverview details={details} />}
      {currentTab === "Assignment" && <AssignmentBoard details={details} />}
      {currentTab === "Evaluations" && (
        <TeacherEvaluations details={details} reports={reports} judges={judges} />
      )}
      {currentTab === "Settings" && <ProjectSettings details={details} />}
    </PageContainer>
  );
};
