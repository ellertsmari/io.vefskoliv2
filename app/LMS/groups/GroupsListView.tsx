"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "UIcomponents/modal/modal";
import { GroupProjectListItem } from "types/groupTypes";
import {
  GROUP_PROJECT_MODULES,
  PROJECT_STATUS_LABELS,
} from "constants/groupWork";
import { createGroupProject } from "serverActions/groups/manageGroupProject";
import {
  PageContainer,
  PageHeader,
  PageTitle,
  SectionTitle,
  MutedText,
  CardGrid,
  ClickableCard,
  StatusChip,
  Pill,
  PrimaryButton,
  Label,
  Input,
  TextArea,
  Message,
  ChipRow,
  SelectableChip,
} from "./styles";
import styled from "styled-components";

const ProjectCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
`;

const ProjectTitle = styled.h3`
  font-size: var(--text-base);
  font-weight: 600;
  margin: 0;
`;

const CallToAction = styled.span`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--theme-module3-100);
`;

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  min-width: min(480px, 85vw);
`;

const DateRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const ProjectCard = ({
  project,
  isTeacher,
}: {
  project: GroupProjectListItem;
  isTeacher: boolean;
}) => {
  const studentCta = () => {
    if (isTeacher) return null;
    if (project.status === "formation" && !project.hasPreferences) {
      return <CallToAction>Fill in your preferences →</CallToAction>;
    }
    if (project.myTeamName) {
      return <CallToAction>Your team: {project.myTeamName} →</CallToAction>;
    }
    if (project.status === "formation") {
      return <CallToAction>Waiting for team assignment…</CallToAction>;
    }
    return null;
  };

  return (
    <ClickableCard href={`/LMS/groups/${project._id}`}>
      <ProjectCardHeader>
        <ProjectTitle>{project.title}</ProjectTitle>
        <StatusChip $status={project.status}>
          {PROJECT_STATUS_LABELS[project.status]}
        </StatusChip>
      </ProjectCardHeader>
      <MutedText>
        {formatDate(project.startDate)} – {formatDate(project.endDate)}
      </MutedText>
      <PillRow>
        {project.module != null && <Pill>Module {project.module}</Pill>}
        <Pill>
          {project.teamCount} team{project.teamCount === 1 ? "" : "s"}
        </Pill>
        {project.peerEvalOpen && <Pill>Peer evaluation open</Pill>}
        {project.teamEvalOpen && <Pill>Team evaluation open</Pill>}
      </PillRow>
      {studentCta()}
    </ClickableCard>
  );
};

const CreateProjectForm = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await createGroupProject({
      title,
      description,
      module,
      startDate,
      endDate,
    });
    setSubmitting(false);
    if (result.success) {
      onClose();
      router.push(`/LMS/groups/${result.data.id}`);
    } else {
      setError(result.message);
    }
  };

  return (
    <ModalForm onSubmit={handleSubmit}>
      <SectionTitle>New group project</SectionTitle>
      <Label>
        Title
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Design Sprint — September"
          required
        />
      </Label>
      <Label>
        Description (markdown)
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about? Goals, deliverables, schedule…"
        />
      </Label>
      <Label as="div">
        Module
        <ChipRow>
          {GROUP_PROJECT_MODULES.map((option) => (
            <SelectableChip
              key={option}
              type="button"
              $selected={module === option}
              onClick={() => setModule(module === option ? null : option)}
            >
              Module {option}
            </SelectableChip>
          ))}
        </ChipRow>
      </Label>
      <DateRow>
        <Label>
          Start date
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </Label>
        <Label>
          End date
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </Label>
      </DateRow>
      {error && <Message $error>{error}</Message>}
      <PrimaryButton type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create project"}
      </PrimaryButton>
    </ModalForm>
  );
};

export const GroupsListView = ({
  projects,
  isTeacher,
}: {
  projects: GroupProjectListItem[];
  isTeacher: boolean;
}) => {
  const modalState = useState(false);
  const current = projects.filter((p) => p.status !== "archived");
  const archived = projects.filter((p) => p.status === "archived");

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Group Projects</PageTitle>
        {isTeacher && (
          <Modal
            state={modalState}
            modalTrigger={<PrimaryButton>+ New project</PrimaryButton>}
            modalContent={
              <CreateProjectForm onClose={() => modalState[1](false)} />
            }
          />
        )}
      </PageHeader>

      {current.length === 0 && (
        <MutedText>
          {isTeacher
            ? "No group projects yet. Create one to get started."
            : "No group projects right now — your teachers will set one up when the next group project starts."}
        </MutedText>
      )}

      <CardGrid>
        {current.map((project) => (
          <ProjectCard
            key={project._id}
            project={project}
            isTeacher={isTeacher}
          />
        ))}
      </CardGrid>

      {archived.length > 0 && (
        <>
          <SectionTitle>Past projects</SectionTitle>
          <CardGrid>
            {archived.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                isTeacher={isTeacher}
              />
            ))}
          </CardGrid>
        </>
      )}
    </PageContainer>
  );
};
