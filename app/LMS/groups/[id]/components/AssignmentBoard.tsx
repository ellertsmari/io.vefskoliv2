"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { BoardStudent, GroupProjectDetails } from "types/groupTypes";
import {
  FOCUS_OPTIONS,
  techStackOptionsForModule,
} from "constants/groupWork";
import {
  createTeam,
  deleteTeam,
  saveAssignments,
} from "serverActions/groups/manageTeams";
import {
  Card,
  SectionTitle,
  MutedText,
  SecondaryButton,
  DangerButton,
  SelectableChip,
  ChipRow,
  Message,
  Pill,
} from "../../styles";
import { MemberAvatar } from "./TeamHubTab";

const Board = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
`;

const DropZone = styled.div<{ $over: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 60px;
  border-radius: 8px;
  padding: 0.25rem;
  background: ${({ $over }) => ($over ? "var(--primary-black-10)" : "transparent")};
  transition: background 0.15s ease;
`;

const StudentCard = styled.div<{ $dragging: boolean }>`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  cursor: grab;
  opacity: ${({ $dragging }) => ($dragging ? 0.4 : 1)};
`;

const StudentName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const MoveSelect = styled.select`
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.25rem;
  font-size: 0.8rem;
  background: white;
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const TeamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const UNASSIGNED = "__unassigned__";

export const AssignmentBoard = ({
  details,
}: {
  details: GroupProjectDetails;
}) => {
  const router = useRouter();
  const students = useMemo(() => details.students || [], [details.students]);
  const teams = details.teams;

  // Optimistic team-per-student overrides while the save round-trips.
  const [overrides, setOverrides] = useState<Map<string, string | null>>(
    new Map()
  );
  const [savingCount, setSavingCount] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [focusFilter, setFocusFilter] = useState<string | null>(null);
  const [techFilter, setTechFilter] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  // Drop overrides once the refreshed server state confirms them (or their
  // target team disappeared) so the board never masks fresher data.
  useEffect(() => {
    setOverrides((prev) => {
      if (prev.size === 0) return prev;
      const teamIds = new Set(teams.map((team) => team._id));
      const next = new Map(prev);
      for (const [studentId, teamId] of prev) {
        const serverTeamId =
          students.find((s) => s._id === studentId)?.teamId ?? null;
        const targetGone = teamId !== null && !teamIds.has(teamId);
        if (serverTeamId === teamId || targetGone) next.delete(studentId);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [students, teams]);

  const effectiveTeamId = (student: BoardStudent) =>
    overrides.has(student._id)
      ? overrides.get(student._id)!
      : student.teamId;

  const matchesFilters = (student: BoardStudent) => {
    if (!focusFilter && !techFilter) return true;
    const prefs = student.preferences;
    if (!prefs) return false;
    if (focusFilter && !prefs.focus.includes(focusFilter)) return false;
    if (techFilter && !prefs.techStack.includes(techFilter)) return false;
    return true;
  };

  // Every move is saved straight away — the override keeps the card in place
  // until the refreshed server state takes over.
  const moveStudent = async (studentId: string, teamId: string | null) => {
    const current =
      students.find((s) => s._id === studentId)?.teamId ?? null;
    const effective = overrides.has(studentId)
      ? overrides.get(studentId)!
      : current;
    if (effective === teamId) return;

    setOverrides((prev) => new Map(prev).set(studentId, teamId));
    setMessage(null);
    setSavingCount((count) => count + 1);

    const result = await saveAssignments({
      projectId: details.project._id,
      changes: [{ userId: studentId, teamId }],
    });

    setSavingCount((count) => count - 1);
    if (result.success) {
      router.refresh();
    } else {
      // Roll the card back and surface the error.
      setOverrides((prev) => {
        const next = new Map(prev);
        next.delete(studentId);
        return next;
      });
      setMessage({ text: result.message, error: true });
    }
  };

  const handleDrop = (zone: string) => (event: React.DragEvent) => {
    event.preventDefault();
    setDragOverZone(null);
    if (!draggingId) return;
    moveStudent(draggingId, zone === UNASSIGNED ? null : zone);
    setDraggingId(null);
  };

  const handleCreateTeam = async () => {
    setBusy(true);
    const result = await createTeam({ projectId: details.project._id });
    setBusy(false);
    if (result.success) {
      router.refresh();
    } else {
      setMessage({ text: result.message, error: true });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    setBusy(true);
    const result = await deleteTeam({ teamId });
    setBusy(false);
    if (result.success) {
      router.refresh();
    } else {
      setMessage({ text: result.message, error: true });
    }
  };

  const renderStudent = (student: BoardStudent) => (
    <StudentCard
      key={student._id}
      draggable
      $dragging={draggingId === student._id}
      onDragStart={(event) => {
        setDraggingId(student._id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        setDraggingId(null);
        setDragOverZone(null);
      }}
      title={student.preferences?.about || undefined}
    >
      <StudentName>
        <MemberAvatar name={student.name} avatarUrl={student.avatarUrl} />
        {student.name}
      </StudentName>
      {student.preferences && (
        <BadgeRow>
          {student.preferences.ambition && (
            <Pill>{student.preferences.ambition}</Pill>
          )}
          {student.preferences.focus.map((item) => (
            <Pill key={item}>{item}</Pill>
          ))}
        </BadgeRow>
      )}
      <MoveSelect
        aria-label={`Move ${student.name} to a team`}
        value={effectiveTeamId(student) ?? UNASSIGNED}
        onChange={(event) =>
          moveStudent(
            student._id,
            event.target.value === UNASSIGNED ? null : event.target.value
          )
        }
      >
        <option value={UNASSIGNED}>Unassigned</option>
        {teams.map((team) => (
          <option key={team._id} value={team._id}>
            {team.name}
          </option>
        ))}
      </MoveSelect>
    </StudentCard>
  );

  const unassigned = students
    .filter((student) => effectiveTeamId(student) === null)
    .filter(matchesFilters);

  return (
    <Layout>
      <ActionBar>
        <SecondaryButton onClick={handleCreateTeam} disabled={busy}>
          + Create team
        </SecondaryButton>
        <MutedText aria-live="polite">
          {savingCount > 0
            ? "Saving…"
            : "Changes are saved automatically when you move a student."}
        </MutedText>
        {message && <Message $error={message.error}>{message.text}</Message>}
      </ActionBar>

      <ChipRow>
        {FOCUS_OPTIONS.map((option) => (
          <SelectableChip
            key={option}
            type="button"
            $selected={focusFilter === option}
            onClick={() =>
              setFocusFilter(focusFilter === option ? null : option)
            }
          >
            {option}
          </SelectableChip>
        ))}
        {techStackOptionsForModule(details.project.module).map((option) => (
          <SelectableChip
            key={option}
            type="button"
            $selected={techFilter === option}
            onClick={() => setTechFilter(techFilter === option ? null : option)}
          >
            {option}
          </SelectableChip>
        ))}
      </ChipRow>

      <Board>
        <Card
          onDragOver={(event) => {
            event.preventDefault();
            setDragOverZone(UNASSIGNED);
          }}
          onDragLeave={() => setDragOverZone(null)}
          onDrop={handleDrop(UNASSIGNED)}
        >
          <SectionTitle>
            Unassigned ({unassigned.length})
          </SectionTitle>
          <DropZone $over={dragOverZone === UNASSIGNED}>
            {unassigned.map(renderStudent)}
            {unassigned.length === 0 && (
              <MutedText>Everyone is assigned 🎉</MutedText>
            )}
          </DropZone>
        </Card>

        <TeamsGrid>
          {teams.length === 0 && (
            <MutedText>
              No teams yet — create the first one to start assigning students.
            </MutedText>
          )}
          {teams.map((team) => {
            const teamStudents = students
              .filter((student) => effectiveTeamId(student) === team._id)
              .filter(matchesFilters);
            return (
              <Card
                key={team._id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverZone(team._id);
                }}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={handleDrop(team._id)}
              >
                <TeamHeader>
                  <SectionTitle>
                    {team.name} ({teamStudents.length})
                  </SectionTitle>
                  {teamStudents.length === 0 && (
                    <DangerButton
                      onClick={() => handleDeleteTeam(team._id)}
                      disabled={busy}
                    >
                      Delete
                    </DangerButton>
                  )}
                </TeamHeader>
                <DropZone $over={dragOverZone === team._id}>
                  {teamStudents.map(renderStudent)}
                  {teamStudents.length === 0 && (
                    <MutedText>Drag students here</MutedText>
                  )}
                </DropZone>
              </Card>
            );
          })}
        </TeamsGrid>
      </Board>
    </Layout>
  );
};
