"use client";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  EvaluationReports,
  GroupProjectDetails,
  PeerEvalStudentReport,
  SerializedJudgeInvitation,
} from "types/groupTypes";
import {
  CONTRIBUTION_SCORES,
  PEER_RESULT_MAX,
  PEER_RESULT_MIN,
  PEER_RESULT_STEP,
  TEAMBUILDING_SCORES,
  categoryLabel,
  clampGrade,
  disciplineMetaForCategory,
  peerGradeFactor,
  rubricForProject,
} from "constants/groupWork";
import { submitTeamEvaluation } from "serverActions/groups/submitTeamEvaluation";
import {
  clearPeerEvalResult,
  confirmAllPeerEvalResults,
  confirmPeerEvalResult,
} from "serverActions/groups/managePeerEvalResults";
import {
  Card,
  SectionTitle,
  MutedText,
  ChipRow,
  SelectableChip,
  ScorePill,
  Pill,
  Input,
  TextArea,
  Label,
  PrimaryButton,
  SecondaryButton,
  Message,
} from "../../styles";
import { TeamEvalForm } from "./TeamEvalForm";
import { JudgesPanel } from "./JudgesPanel";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);

  th {
    text-align: left;
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--primary-black-60);
    padding: 0.5rem;
    border-bottom: 2px solid var(--primary-black-10);
  }

  td {
    padding: 0.5rem;
    border-bottom: 1px solid var(--primary-black-10);
  }
`;

const ExpandableRow = styled.tr`
  cursor: pointer;

  &:hover {
    background: var(--primary-black-5);
  }
`;

const ScoreCell = styled.td<{ $value: number | null }>`
  font-weight: 700;
  color: ${({ $value }) =>
    $value === null
      ? "var(--primary-black-60)"
      : $value < -0.5
        ? "var(--error-failure-100)"
        : $value > 0.5
          ? "var(--error-success-100)"
          : "inherit"};
`;

const ReceivedEval = styled.div`
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  margin: 0.4rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: var(--text-sm);
`;

const PlotWrapper = styled.div`
  max-width: 480px;
`;

const ReportHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ResultForm = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  margin: 0.4rem 0;
`;

const ScoreField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 9rem;
`;

const NoteField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1 1 260px;
`;

const GradePreview = styled.div`
  font-size: var(--text-base);
  font-weight: 700;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const WarnPill = styled(Pill)`
  color: var(--error-failure-100);
  border-color: var(--error-failure-100);
`;

// Simple SVG scatter plot: contribution avg (x) vs teamwork avg (y), -2..2.
const ScatterPlot = ({ reports }: { reports: PeerEvalStudentReport[] }) => {
  const size = 400;
  const pad = 40;
  const scale = (value: number) =>
    pad + ((value + 2) / 4) * (size - 2 * pad);
  const points = reports.filter(
    (report) =>
      report.contributionAvg !== null && report.teambuildingAvg !== null
  );

  if (points.length === 0) return null;

  return (
    <PlotWrapper>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Scatter plot of contribution vs teamwork averages"
      >
        {/* axes through 0 */}
        <line
          x1={scale(0)}
          y1={pad}
          x2={scale(0)}
          y2={size - pad}
          stroke="var(--primary-black-10)"
        />
        <line
          x1={pad}
          y1={size - scale(0)}
          x2={size - pad}
          y2={size - scale(0)}
          stroke="var(--primary-black-10)"
        />
        <text x={size - pad} y={size - scale(0) - 6} fontSize="10" textAnchor="end" fill="var(--primary-black-60)">
          contribution →
        </text>
        <text x={scale(0) + 6} y={pad + 4} fontSize="10" fill="var(--primary-black-60)">
          teamwork ↑
        </text>
        {points.map((report) => (
          <g key={report.userId}>
            <circle
              cx={scale(report.contributionAvg!)}
              cy={size - scale(report.teambuildingAvg!)}
              r={5}
              fill="var(--theme-module3-100)"
              opacity={0.75}
            >
              <title>
                {report.name} ({report.teamName}): contribution{" "}
                {report.contributionAvg}, teamwork {report.teambuildingAvg}
              </title>
            </circle>
            <text
              x={scale(report.contributionAvg!) + 7}
              y={size - scale(report.teambuildingAvg!) + 3}
              fontSize="9"
              fill="var(--primary-black-60)"
            >
              {report.name.split(" ")[0]}
            </text>
          </g>
        ))}
      </svg>
    </PlotWrapper>
  );
};

/** Where a student's confirmed result stands, for the status column. */
const resultStatus = (report: PeerEvalStudentReport) => {
  const result = report.result;
  if (!result) return { label: "Pending", title: "Not confirmed yet" };
  if (
    result.basedOnCount !== null &&
    result.basedOnCount !== report.receivedCount
  ) {
    return {
      label: "Review",
      title: `Confirmed on ${result.basedOnCount} evaluation(s); there are now ${report.receivedCount}`,
      warn: true,
    };
  }
  const changed =
    (result.basedOnContribution !== null &&
      result.contribution !== result.basedOnContribution) ||
    (result.basedOnTeambuilding !== null &&
      result.teambuilding !== result.basedOnTeambuilding);
  if (changed) {
    return {
      label: "Changed",
      title: `The team said ${result.basedOnContribution} / ${result.basedOnTeambuilding}`,
    };
  }
  return { label: "Confirmed", title: `By ${result.confirmedByName}` };
};

/**
 * The teacher's decision for one student: accept what the team said, or
 * replace it. The note is for the teachers themselves — nothing here reaches
 * the student.
 */
const PeerResultEditor = ({
  projectId,
  report,
}: {
  projectId: string;
  report: PeerEvalStudentReport;
}) => {
  const router = useRouter();
  const [contribution, setContribution] = useState(
    String(report.result?.contribution ?? report.contributionAvg ?? 0)
  );
  const [teambuilding, setTeambuilding] = useState(
    String(report.result?.teambuilding ?? report.teambuildingAvg ?? 0)
  );
  const [note, setNote] = useState(report.result?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  // What the numbers in the boxes would produce, recomputed as they are typed,
  // against the project grade this student's team already has.
  const projectGrade = report.grade?.projectGrade ?? null;
  const parsed = [Number(contribution), Number(teambuilding)];
  const preview =
    projectGrade !== null && parsed.every((value) => Number.isFinite(value))
      ? (() => {
          const factor = peerGradeFactor(parsed[0], parsed[1]);
          return {
            projectGrade,
            factor: Math.round(factor * 1000) / 1000,
            grade: clampGrade(projectGrade * factor),
          };
        })()
      : null;

  const run = async (
    action: () => Promise<{ success: boolean; message?: string }>
  ) => {
    setSaving(true);
    setFeedback(null);
    const result = await action();
    setSaving(false);
    setFeedback({
      text: result.message || (result.success ? "Saved" : "Failed"),
      error: !result.success,
    });
    if (result.success) router.refresh();
  };

  return (
    <ResultForm>
      <ScoreField>
        <Label htmlFor={`peer-contribution-${report.userId}`}>
          Contribution
        </Label>
        <Input
          id={`peer-contribution-${report.userId}`}
          type="number"
          min={PEER_RESULT_MIN}
          max={PEER_RESULT_MAX}
          step={PEER_RESULT_STEP}
          value={contribution}
          onChange={(event) => setContribution(event.target.value)}
        />
        <MutedText>
          Team said{" "}
          {report.contributionAvg === null
            ? "nothing yet"
            : report.contributionAvg}
        </MutedText>
      </ScoreField>
      <ScoreField>
        <Label htmlFor={`peer-teambuilding-${report.userId}`}>Teamwork</Label>
        <Input
          id={`peer-teambuilding-${report.userId}`}
          type="number"
          min={PEER_RESULT_MIN}
          max={PEER_RESULT_MAX}
          step={PEER_RESULT_STEP}
          value={teambuilding}
          onChange={(event) => setTeambuilding(event.target.value)}
        />
        <MutedText>
          Team said{" "}
          {report.teambuildingAvg === null
            ? "nothing yet"
            : report.teambuildingAvg}
        </MutedText>
      </ScoreField>
      <ScoreField>
        <Label as="span">Grade this produces</Label>
        <GradePreview>
          {preview === null ? (
            "—"
          ) : (
            <>
              {preview.grade} / 10
              <MutedText>
                {preview.projectGrade} × {preview.factor}
              </MutedText>
            </>
          )}
        </GradePreview>
      </ScoreField>
      <NoteField>
        <Label htmlFor={`peer-note-${report.userId}`}>
          Note (teachers only)
        </Label>
        <TextArea
          id={`peer-note-${report.userId}`}
          value={note}
          style={{ minHeight: "60px" }}
          placeholder="Why this differs from the team's average, if it does"
          onChange={(event) => setNote(event.target.value)}
        />
      </NoteField>
      <PrimaryButton
        type="button"
        disabled={
          saving || contribution.trim() === "" || teambuilding.trim() === ""
        }
        onClick={() =>
          run(() =>
            confirmPeerEvalResult({
              projectId,
              studentId: report.userId,
              contribution: Number(contribution),
              teambuilding: Number(teambuilding),
              note,
            })
          )
        }
      >
        {report.result ? "Save" : "Confirm"}
      </PrimaryButton>
      {report.result && (
        <SecondaryButton
          type="button"
          disabled={saving}
          onClick={() =>
            run(() =>
              clearPeerEvalResult({ projectId, studentId: report.userId })
            )
          }
        >
          Clear
        </SecondaryButton>
      )}
      {feedback && <Message $error={feedback.error}>{feedback.text}</Message>}
    </ResultForm>
  );
};

const PeerEvalReport = ({
  projectId,
  reports,
}: {
  projectId: string;
  reports: PeerEvalStudentReport[];
}) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  if (reports.length === 0) {
    return <MutedText>No students are assigned to teams yet.</MutedText>;
  }

  const pending = reports.filter(
    (report) => !report.result && report.receivedCount > 0
  ).length;

  const confirmAll = async () => {
    setConfirming(true);
    setBulkFeedback(null);
    const result = await confirmAllPeerEvalResults({ projectId });
    setConfirming(false);
    setBulkFeedback(result.message ?? null);
    if (result.success) router.refresh();
  };

  return (
    <Card>
      <ReportHeader>
        <SectionTitle>Peer evaluation report</SectionTitle>
        {pending > 0 && (
          <PrimaryButton type="button" disabled={confirming} onClick={confirmAll}>
            {confirming
              ? "Confirming…"
              : `Confirm ${pending} as the team scored them`}
          </PrimaryButton>
        )}
      </ReportHeader>
      <MutedText>
        Averages of the scores each student received from their team, their own
        self-evaluation included (−2 to +2). They are advice: nothing is
        published until you confirm a contribution and a teamwork figure for
        the student, and those confirmed figures are what turn the team&apos;s
        project grade into an individual one. Click a row to read the
        evaluations and to confirm or change them.
      </MutedText>
      {bulkFeedback && <Message>{bulkFeedback}</Message>}
      <ScatterPlot reports={reports} />
      <Table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Team</th>
            <th>Contribution</th>
            <th>Teamwork</th>
            <th>Confirmed</th>
            <th>Grade</th>
            <th>Status</th>
            <th>Received</th>
            <th>Given</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const status = resultStatus(report);
            return (
              <Fragment key={report.userId}>
                <ExpandableRow
                  onClick={() =>
                    setExpanded(
                      expanded === report.userId ? null : report.userId
                    )
                  }
                >
                  <td>{report.name}</td>
                  <td>{report.teamName}</td>
                  <ScoreCell $value={report.contributionAvg}>
                    {report.contributionAvg ?? "—"}
                  </ScoreCell>
                  <ScoreCell $value={report.teambuildingAvg}>
                    {report.teambuildingAvg ?? "—"}
                  </ScoreCell>
                  <td>
                    {report.result
                      ? `${report.result.contribution} / ${report.result.teambuilding}`
                      : "—"}
                  </td>
                  <td>
                    {report.grade ? (
                      <strong title={`${report.grade.projectGrade} × ${report.grade.factor}`}>
                        {report.grade.grade} / 10
                      </strong>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {status.warn ? (
                      <WarnPill title={status.title}>{status.label}</WarnPill>
                    ) : (
                      <Pill title={status.title}>{status.label}</Pill>
                    )}
                  </td>
                  <td>{report.receivedCount}</td>
                  <td>
                    {report.givenCount}
                    {report.givenUnbalanced && (
                      <>
                        {" "}
                        <WarnPill title="These scores add up to more than zero — given before the balance rule existed">
                          unbalanced
                        </WarnPill>
                      </>
                    )}
                  </td>
                </ExpandableRow>
                {expanded === report.userId && (
                  <tr>
                    <td colSpan={9}>
                      <PeerResultEditor projectId={projectId} report={report} />
                      {report.received.length === 0 && (
                        <MutedText>No evaluations received yet.</MutedText>
                      )}
                      {report.received.map((evaluation, index) => (
                        <ReceivedEval key={index}>
                          <strong>
                            {evaluation.evaluatorName}
                            {evaluation.isSelf && " (self)"}
                            {evaluation.evaluatorUnbalanced && (
                              <>
                                {" "}
                                <WarnPill title="This evaluator's scores add up to more than zero — given before the balance rule existed">
                                  pre-rule
                                </WarnPill>
                              </>
                            )}
                          </strong>
                          <span>
                            Contribution:{" "}
                            {CONTRIBUTION_SCORES[evaluation.contributionScore]
                              ?.label ?? evaluation.contributionScore}{" "}
                            — {evaluation.contributionComment}
                          </span>
                          <span>
                            Teamwork:{" "}
                            {TEAMBUILDING_SCORES[evaluation.teambuildingScore]
                              ?.label ?? evaluation.teambuildingScore}{" "}
                            — {evaluation.teambuildingComment}
                          </span>
                        </ReceivedEval>
                      ))}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
};

export const TeacherEvaluations = ({
  details,
  reports,
  judges,
}: {
  details: GroupProjectDetails;
  reports: EvaluationReports | null;
  judges: SerializedJudgeInvitation[];
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    details.teams[0]?._id ?? null
  );
  const selectedTeam = details.teams.find(
    (team) => team._id === selectedTeamId
  );

  return (
    <Layout>
      {details.teams.length === 0 ? (
        <MutedText>
          No teams yet — create them on the Assignment tab first.
        </MutedText>
      ) : (
        <>
          <SectionTitle>Score a team</SectionTitle>
          <ChipRow>
            {details.teams.map((team) => {
              const done =
                (details.myTeamEvaluations[team._id]?.length ?? 0) > 0;
              return (
                <SelectableChip
                  key={team._id}
                  type="button"
                  $selected={selectedTeamId === team._id}
                  onClick={() => setSelectedTeamId(team._id)}
                >
                  {team.name}
                  {done ? " ✓" : ""}
                </SelectableChip>
              );
            })}
          </ChipRow>
          {selectedTeam && (
            <TeamEvalForm
              key={selectedTeam._id}
              heading={`Evaluate ${selectedTeam.name}`}
              rubric={rubricForProject(details.project.rubric)}
              existing={details.myTeamEvaluations[selectedTeam._id] || []}
              draftKey={`teacher-eval:${details.project._id}:${selectedTeam._id}`}
              onSubmit={(data) =>
                submitTeamEvaluation({
                  projectId: details.project._id,
                  teamId: selectedTeam._id,
                  ...data,
                })
              }
            />
          )}
        </>
      )}

      <JudgesPanel projectId={details.project._id} judges={judges} />

      {reports && (
        <PeerEvalReport
          projectId={details.project._id}
          reports={reports.peerEvals}
        />
      )}

      {reports && reports.teamEvals.some((team) => team.entries.length > 0) && (
        <Card>
          <SectionTitle>Team evaluation results</SectionTitle>
          {reports.teamEvals
            .filter((team) => team.entries.length > 0)
            .map((team) => (
              <div key={team.teamId}>
                <SectionTitle as="h3" style={{ fontSize: "var(--text-base)" }}>
                  {team.teamName}
                </SectionTitle>
                <ChipRow style={{ margin: "0.5rem 0" }}>
                  {Object.entries(team.categories).map(([category, bucket]) => {
                    const meta = disciplineMetaForCategory(
                      details.project.rubric,
                      category
                    );
                    return (
                      <ScorePill
                        key={category}
                        $color={meta.color}
                        $background={meta.background}
                      >
                        {categoryLabel(details.project.rubric, category)}:{" "}
                        {bucket.avg} avg ({bucket.count})
                      </ScorePill>
                    );
                  })}
                </ChipRow>
                {team.entries
                  .filter((entry) => entry.comment)
                  .map((entry, index) => {
                    const meta = disciplineMetaForCategory(
                      details.project.rubric,
                      entry.category
                    );
                    return (
                      <ReceivedEval key={index}>
                        <span>
                          <strong>{entry.evaluatorName}</strong>
                          {entry.evaluatorIsTeacher && " (teacher)"}
                          {entry.evaluatorIsJudge && " (judge)"} —{" "}
                          {categoryLabel(
                            details.project.rubric,
                            entry.category
                          )}
                          {entry.score !== null && (
                            <>
                              :{" "}
                              <ScorePill
                                $color={meta.color}
                                $background={meta.background}
                              >
                                {entry.score}/10
                              </ScorePill>
                            </>
                          )}
                        </span>
                        <span>{entry.comment}</span>
                      </ReceivedEval>
                    );
                  })}
              </div>
            ))}
        </Card>
      )}
    </Layout>
  );
};
