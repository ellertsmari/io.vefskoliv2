"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { GroupProjectDetails } from "types/groupTypes";
import {
  GroupProjectStatus,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
} from "constants/groupWork";
import { updateGroupProject } from "serverActions/groups/manageGroupProject";
import {
  Card,
  SectionTitle,
  MutedText,
  Label,
  Input,
  TextArea,
  PrimaryButton,
  SelectableChip,
  ChipRow,
  Message,
} from "../../styles";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const DateRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
`;

const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const STATUS_HELP: Record<GroupProjectStatus, string> = {
  formation:
    "Students fill in their preferences and you compose teams on the Assignment tab.",
  active:
    "Teams are set — students work on the project and keep their Team Hub up to date.",
  archived: "Read-only history. Received feedback becomes visible to teams.",
};

const toDateInput = (iso: string) => iso.slice(0, 10);

export const ProjectSettings = ({
  details,
}: {
  details: GroupProjectDetails;
}) => {
  const router = useRouter();
  const { project } = details;
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [startDate, setStartDate] = useState(toDateInput(project.startDate));
  const [endDate, setEndDate] = useState(toDateInput(project.endDate));
  const [status, setStatus] = useState<GroupProjectStatus>(project.status);
  const [peerEvalOpen, setPeerEvalOpen] = useState(project.peerEvalOpen);
  const [teamEvalOpen, setTeamEvalOpen] = useState(project.teamEvalOpen);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    const result = await updateGroupProject({
      projectId: project._id,
      title,
      description,
      startDate,
      endDate,
      status,
      peerEvalOpen,
      teamEvalOpen,
    });
    setSaving(false);
    setFeedback({
      text: result.success ? "Project saved!" : result.message,
      error: !result.success,
    });
    if (result.success) router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Layout>
        <Card>
          <SectionTitle>Project details</SectionTitle>
          <Label>
            Title
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Label>
          <Label>
            Description (markdown)
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
        </Card>

        <Card>
          <SectionTitle>Phase</SectionTitle>
          <ChipRow>
            {PROJECT_STATUSES.map((option) => (
              <SelectableChip
                key={option}
                type="button"
                $selected={status === option}
                onClick={() => setStatus(option)}
              >
                {PROJECT_STATUS_LABELS[option]}
              </SelectableChip>
            ))}
          </ChipRow>
          <MutedText>{STATUS_HELP[status]}</MutedText>
        </Card>

        <Card>
          <SectionTitle>Evaluation gates</SectionTitle>
          <ToggleRow>
            <input
              type="checkbox"
              checked={peerEvalOpen}
              onChange={(e) => setPeerEvalOpen(e.target.checked)}
            />
            Peer evaluation open — students rate their own teammates
          </ToggleRow>
          <ToggleRow>
            <input
              type="checkbox"
              checked={teamEvalOpen}
              onChange={(e) => setTeamEvalOpen(e.target.checked)}
            />
            Team evaluation open — students score the other teams&apos;
            presentations
          </ToggleRow>
        </Card>

        <Footer>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </PrimaryButton>
          {feedback && (
            <Message $error={feedback.error}>{feedback.text}</Message>
          )}
        </Footer>
      </Layout>
    </form>
  );
};
