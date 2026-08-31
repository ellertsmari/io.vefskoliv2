"use client";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { GroupProjectDetails } from "types/groupTypes";
import {
  GROUP_PROJECT_MODULES,
  PANEL_WEIGHT_PRESETS,
  RubricItem,
  minutesFromTime,
  presentationLengthForModule,
  presentationStartOptions,
  timeFromMinutes,
} from "constants/groupWork";
import { updateGroupProject } from "serverActions/groups/manageGroupProject";
import { RubricEditor, initialRubric } from "./RubricEditor";
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
  font-size: var(--text-sm);
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
  font-size: var(--text-sm);
  font-weight: 600;
`;

const SlotEnd = styled.span`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  font-variant-numeric: tabular-nums;
`;

const TimeSelect = styled.select`
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.35rem 0.5rem;
  font-size: var(--text-sm);
  background: white;
  font-variant-numeric: tabular-nums;
`;

const LengthRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
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
  const [rubric, setRubric] = useState<RubricItem[]>(() =>
    initialRubric(project.rubric)
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

  // Formation → active happens automatically on the start date. Finishing is
  // the one manual phase change left, and it publishes the grades in the same
  // breath: a grade that can still move is worse than one that has not arrived
  // yet, so team evaluation closes at the same moment. Written feedback never
  // waited for any of this — it opens for each student the day they hand in.
  const handleFinishToggle = async () => {
    const finishing = project.status !== "archived";
    if (finishing) {
      const unconfirmed = details.unconfirmedCount ?? 0;
      const warning =
        unconfirmed > 0
          ? `\n\n${unconfirmed} student${unconfirmed === 1 ? " has" : "s have"} no confirmed peer figures yet and will see "not final yet" instead of a grade.`
          : "";
      if (
        !window.confirm(
          `Complete this project and publish the grades?\n\nTeam hubs become read-only, team evaluation closes so no late score can move a published grade, and every confirmed student sees their own grade.${warning}`
        )
      ) {
        return;
      }
    }
    setSaving(true);
    setFeedback(null);
    const result = await updateGroupProject({
      projectId: project._id,
      status: finishing ? "archived" : "active",
      gradesReleased: finishing,
      // Reopening leaves the gates alone: turning team evaluation back on is a
      // separate, deliberate choice with the toggle above.
      ...(finishing ? { teamEvalOpen: false } : null),
    });
    setSaving(false);
    if (result.success) {
      setTeamEvalOpen(finishing ? false : teamEvalOpen);
      router.refresh();
    } else {
      setFeedback({ text: result.message, error: true });
    }
  };

  // Changing the weighting after publication moves grades students have
  // already read, so it says so before it does it.
  const handlePanelWeight = async (weight: number) => {
    if (
      project.gradesReleased &&
      !window.confirm(
        "The grades are already published. Changing the weighting recalculates every team's score and every student's grade. Continue?"
      )
    ) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    const result = await updateGroupProject({
      projectId: project._id,
      panelWeight: weight,
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
      rubric,
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
          <SectionTitle as="h3" style={{ fontSize: "var(--text-base)" }}>
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

        <RubricEditor
          projectId={project._id}
          module={module}
          rubric={rubric}
          savedKeys={project.rubric.map((item) => item.key)}
          locked={details.rubricLocked}
          onChange={setRubric}
        />

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
            Peer evaluation open — students rate themselves and their teammates
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
          <SectionTitle>Grade weighting</SectionTitle>
          <MutedText>
            How much of each score the panel — teachers and invited industry
            judges — carries, with the student audience carrying the rest. In
            the first module the students&apos; scores are practice: they are
            two weeks into the course, the written feedback is the point, and
            100 / 0 keeps their numbers out of the grade. Later on they are
            comfortable owning a fifth of it.
          </MutedText>
          <ChipRow>
            {PANEL_WEIGHT_PRESETS.map((preset) => (
              <SelectableChip
                key={preset}
                type="button"
                $selected={Math.abs(project.panelWeight - preset) < 0.001}
                disabled={saving}
                onClick={() => handlePanelWeight(preset)}
              >
                {Math.round(preset * 100)} / {Math.round((1 - preset) * 100)}
              </SelectableChip>
            ))}
          </ChipRow>
          <Label>
            Panel share (%)
            <Input
              type="number"
              min={0}
              max={100}
              step={5}
              value={Math.round(project.panelWeight * 100)}
              disabled={saving}
              onChange={(event) => {
                const percent = Number(event.target.value);
                if (Number.isFinite(percent) && percent >= 0 && percent <= 100) {
                  handlePanelWeight(percent / 100);
                }
              }}
            />
          </Label>
        </Card>

        <Card>
          <SectionTitle>Finishing the project</SectionTitle>
          <MutedText>
            {project.status === "archived"
              ? "This project is finished and the grades are published. Team hubs are read-only, every team can read its feedback, and team evaluation is closed so no late score can move a grade a student has already read. Peer evaluation is still accepted."
              : "Finishing publishes the grades in the same breath: team hubs become read-only, every confirmed student sees their own grade, and team evaluation closes so nothing arriving late can move a published grade. Written feedback does not wait for this — it has been open to each student since the day they handed in."}
          </MutedText>
          {project.status !== "archived" && (details.unconfirmedCount ?? 0) > 0 && (
            <Message $error>
              {details.unconfirmedCount} student
              {details.unconfirmedCount === 1 ? "" : "s"} still without
              confirmed peer figures — confirm them on the Evaluations tab, or
              they will see &quot;not final yet&quot; instead of a grade.
            </Message>
          )}
          <div>
            {project.status === "archived" ? (
              <SecondaryButton
                type="button"
                onClick={handleFinishToggle}
                disabled={saving}
              >
                Reopen project
              </SecondaryButton>
            ) : (
              <DangerButton
                type="button"
                onClick={handleFinishToggle}
                disabled={saving}
              >
                Complete project &amp; publish grades
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
