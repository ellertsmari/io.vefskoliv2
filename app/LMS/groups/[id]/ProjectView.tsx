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
  MutedText,
  StatusChip,
  TabBar,
  TabButton,
} from "../styles";
import { PreferencesForm } from "./components/PreferencesForm";
import { TeamHubTab } from "./components/TeamHubTab";
import { TeamsGallery } from "./components/TeamsGallery";
import { EvaluateTab } from "./components/EvaluateTab";
import { TeacherOverview } from "./components/TeacherOverview";
import { AssignmentBoard } from "./components/AssignmentBoard";
import { TeacherEvaluations } from "./components/TeacherEvaluations";
import { ProjectSettings } from "./components/ProjectSettings";

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

const Description = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
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
  const { project, myTeamId } = details;

  const tabs = useMemo(() => {
    if (isTeacher) {
      return ["Overview", "Assignment", "Evaluations", "Settings"];
    }
    const studentTabs: string[] = [];
    if (project.status === "formation") studentTabs.push("My Preferences");
    if (myTeamId) studentTabs.push("Team Hub");
    studentTabs.push("Teams");
    if ((project.peerEvalOpen && myTeamId) || project.teamEvalOpen) {
      studentTabs.push("Evaluate");
    }
    return studentTabs;
  }, [isTeacher, project.status, project.peerEvalOpen, project.teamEvalOpen, myTeamId]);

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const currentTab = tabs.includes(activeTab) ? activeTab : tabs[0];

  return (
    <PageContainer>
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

      {project.description && (
        <Description>
          <MarkdownReader>{project.description}</MarkdownReader>
        </Description>
      )}

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

      {currentTab === "My Preferences" && <PreferencesForm details={details} />}
      {currentTab === "Team Hub" && (
        <TeamHubTab details={details} isTeacher={false} />
      )}
      {currentTab === "Teams" && (
        <TeamsGallery details={details} userId={userId} />
      )}
      {currentTab === "Evaluate" && (
        <EvaluateTab details={details} userId={userId} />
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
