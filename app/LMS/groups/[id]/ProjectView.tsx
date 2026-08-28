"use client";
import { useMemo, useState } from "react";
import styled from "styled-components";
import MarkdownReader from "UIcomponents/markdown/reader";
import {
  EvaluationReports,
  GroupProjectDetails,
  SerializedJudgeInvitation,
} from "types/groupTypes";
import { PROJECT_STATUS_LABELS } from "constants/groupWork";
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
} from "../styles";
import { PreferencesForm } from "./components/PreferencesForm";
import { TeamHubTab } from "./components/TeamHubTab";
import { TeamsGallery } from "./components/TeamsGallery";
import { EvaluateTab } from "./components/EvaluateTab";
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

export const ProjectView = ({
  details,
  reports,
  judges,
  isTeacher,
  userId,
}: Props) => {
  const { project, myTeamId, teams } = details;

  const teacherTabs = ["Overview", "Assignment", "Evaluations", "Settings"];

  /**
   * The student's route through the project. Every step is listed whether or
   * not it is open yet — a locked step with a reason tells you what happens
   * next, which a hidden one cannot.
   */
  const steps = useMemo<Step[]>(() => {
    // The server withholds the brief until the formation questions are all
    // answered, so this flag doubles as "step one is finished".
    const preferencesDone = !project.descriptionLocked;
    const inFormation = project.status === "formation";
    const evaluationOpen = (project.peerEvalOpen && !!myTeamId) || project.teamEvalOpen;

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
      done: preferencesDone && !inFormation,
      hint: project.descriptionLocked
        ? "Unlocks when your preferences are in"
        : "What you are building",
    });

    list.push({
      id: "team",
      label: "Your team",
      locked: !myTeamId,
      hint: myTeamId
        ? "Your team and its workspace"
        : "Your teachers are still putting teams together",
    });

    list.push({
      id: "teams",
      label: "All teams",
      locked: teams.length === 0,
      hint: teams.length === 0 ? "Nothing to see until teams exist" : "Everyone on the project",
    });

    if (evaluationOpen) {
      list.push({
        id: "evaluate",
        label: "Evaluate",
        hint: "Give your feedback",
      });
    }

    return list;
  }, [
    project.status,
    project.descriptionLocked,
    project.peerEvalOpen,
    project.teamEvalOpen,
    myTeamId,
    teams.length,
  ]);

  const tabs = isTeacher ? teacherTabs : [];

  // Open on the first step that still needs the student, not simply the first.
  const firstOpenStep =
    steps.find((step) => !step.locked && !step.done)?.id ??
    steps.find((step) => !step.locked)?.id ??
    steps[0]?.id;

  const [activeTab, setActiveTab] = useState(
    isTeacher ? teacherTabs[0] : firstOpenStep
  );
  const available = isTeacher
    ? teacherTabs
    : steps.filter((step) => !step.locked).map((step) => step.id);
  const currentTab = available.includes(activeTab ?? "")
    ? (activeTab as string)
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
            <PreferencesForm details={details} />
          )}
          {currentTab === "brief" &&
            (project.description ? (
              <Description>
                <MarkdownReader>{project.description}</MarkdownReader>
              </Description>
            ) : (
              <MutedText>
                Your teachers haven&apos;t written the brief yet — it will
                appear here.
              </MutedText>
            ))}
          {currentTab === "team" && (
            <TeamHubTab details={details} isTeacher={false} />
          )}
          {currentTab === "teams" && (
            <TeamsGallery details={details} userId={userId} />
          )}
          {currentTab === "evaluate" && (
            <EvaluateTab details={details} userId={userId} />
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
