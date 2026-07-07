"use client";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { GroupProjectDetails } from "types/groupTypes";
import {
  GROUP_PROJECT_MODULES,
  minutesFromTime,
  presentationLengthForModule,
  presentationStartOptions,
  timeFromMinutes,
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
  SecondaryButton,
  DangerButton,
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

const toDateInput = (iso: string) => iso.slice(0, 10);

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.5rem 0.75rem;
  align-items: center;
`;

const SlotTeamName = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
`;

const SlotEnd = styled.span`
  font-size: 0.85rem;
  color: #868e96;
  font-variant-numeric: tabular-nums;
`;

const TimeSelect = styled.select`
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  font-size: 0.9rem;
  background: white;
  font-variant-numeric: tabular-nums;
`;

const LengthRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
`;

const LengthInput = styled(Input)`
  width: 5rem;
`;

const UNSCHEDULED = "";

// Static 09:00–16:00 pick list — build it once, not per team per render.
const START_TIME_OPTIONS = presentationStartOptions();

export const ProjectSettings = ({
  details,
}: {
  details: GroupProjectDetails;
}) => {
  const router = useRouter();
  const { project, teams } = details;
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [module, setModule] = useState<number | null>(project.module);
  const [startDate, setStartDate] = useState(toDateInput(project.startDate));
  const [endDate, setEndDate] = useState(toDateInput(project.endDate));
  const [presentationDate, setPresentationDate] = useState(
    project.presentationDate ? toDateInput(project.presentationDate) : ""
  );
  const [presentationLength, setPresentationLength] = useState(
    project.presentationLength ?? presentationLengthForModule(project.module)
  );
  // Only the start time is chosen per team — the end follows from the length.
  const [slotStarts, setSlotStarts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      teams.map((team) => {
        const slot = project.presentationSlots.find(
          (entry) => entry.team === team._id
        );
        return [team._id, slot?.startTime ?? UNSCHEDULED];
      })
    )
  );
  const [peerEvalOpen, setPeerEvalOpen] = useState(project.peerEvalOpen);
  const [teamEvalOpen, setTeamEvalOpen] = useState(project.teamEvalOpen);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const endTimeFor = (startTime: string) =>
    timeFromMinutes(minutesFromTime(startTime) + presentationLength);

  // Formation → active happens automatically on the start date; the only
  // manual phase change left is archiving (and undoing it).
  const handleArchiveToggle = async () => {
    const archiving = project.status !== "archived";
    if (
      archiving &&
      !window.confirm(
        "Archive this project? It becomes read-only and teams can see the feedback they received."
      )
    ) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    const result = await updateGroupProject({
      projectId: project._id,
      status: archiving ? "archived" : "active",
    });
    setSaving(false);
    if (result.success) {
      router.refresh();
    } else {
      setFeedback({ text: result.message, error: true });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const presentationSlots = teams
      .filter((team) => slotStarts[team._id])
      .map((team) => ({
        team: team._id,
        startTime: slotStarts[team._id],
        endTime: endTimeFor(slotStarts[team._id]),
      }));

    setSaving(true);
    setFeedback(null);
    const result = await updateGroupProject({
      projectId: project._id,
      title,
      description,
      module,
      startDate,
      endDate,
      presentationDate: presentationDate || null,
      presentationLength,
      presentationSlots,
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
          <SectionTitle as="h3" style={{ fontSize: "0.95rem" }}>
            Module
          </SectionTitle>
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
          <MutedText>
            The module decides which tech stack choices students can pick in
            their preferences.
          </MutedText>
        </Card>

        <Card>
          <SectionTitle>Presentations</SectionTitle>
          <MutedText>
            Team evaluation opens automatically on the presentation day, and
            peer evaluation opens once the last presentation slot has ended.
          </MutedText>
          <DateRow>
            <Label>
              Presentation date
              <Input
                type="date"
                value={presentationDate}
                onChange={(e) => setPresentationDate(e.target.value)}
              />
            </Label>
            <Label>
              Length per team (minutes)
              <LengthRow>
                <LengthInput
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  value={presentationLength}
                  onChange={(e) =>
                    setPresentationLength(
                      Math.max(5, parseInt(e.target.value) || 5)
                    )
                  }
                />
                <MutedText>same for all teams</MutedText>
              </LengthRow>
            </Label>
          </DateRow>
          {presentationDate && teams.length > 0 && (
            <SlotGrid>
              {teams.map((team) => (
                <Fragment key={team._id}>
                  <SlotTeamName>{team.name}</SlotTeamName>
                  <TimeSelect
                    aria-label={`${team.name} presentation start`}
                    value={slotStarts[team._id] ?? UNSCHEDULED}
                    onChange={(e) =>
                      setSlotStarts((prev) => ({
                        ...prev,
                        [team._id]: e.target.value,
                      }))
                    }
                  >
                    <option value={UNSCHEDULED}>Not scheduled</option>
                    {START_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </TimeSelect>
                  <SlotEnd>
                    {slotStarts[team._id]
                      ? `ends ${endTimeFor(slotStarts[team._id])}`
                      : "—"}
                  </SlotEnd>
                </Fragment>
              ))}
            </SlotGrid>
          )}
          {presentationDate && teams.length === 0 && (
            <MutedText>
              Create teams on the Assignment tab to schedule their slots.
            </MutedText>
          )}
        </Card>

        <Card>
          <SectionTitle>Evaluation gates</SectionTitle>
          <MutedText>
            These open automatically from the presentation schedule — use the
            toggles to open them earlier or close them again.
          </MutedText>
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

        <Card>
          <SectionTitle>Archive</SectionTitle>
          <MutedText>
            {project.status === "archived"
              ? "This project is archived — read-only, and teams can see the feedback they received."
              : "Archiving makes the project read-only history and shows teams the feedback they received. The project activates by itself on its start date."}
          </MutedText>
          <div>
            {project.status === "archived" ? (
              <SecondaryButton
                type="button"
                onClick={handleArchiveToggle}
                disabled={saving}
              >
                Unarchive project
              </SecondaryButton>
            ) : (
              <DangerButton
                type="button"
                onClick={handleArchiveToggle}
                disabled={saving}
              >
                Archive project
              </DangerButton>
            )}
          </div>
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
