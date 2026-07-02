"use client";
import { Fragment, useState } from "react";
import styled from "styled-components";
import {
  EvaluationReports,
  GroupProjectDetails,
  PeerEvalStudentReport,
} from "types/groupTypes";
import {
  CONTRIBUTION_SCORES,
  TEAMBUILDING_SCORES,
  EVALUATION_CATEGORY_LABELS,
  EvaluationCategory,
} from "constants/groupWork";
import {
  Card,
  SectionTitle,
  MutedText,
  ChipRow,
  SelectableChip,
  Pill,
} from "../../styles";
import { TeamEvalForm } from "./TeamEvalForm";

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th {
    text-align: left;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6c757d;
    padding: 0.5rem;
    border-bottom: 2px solid #e9ecef;
  }

  td {
    padding: 0.5rem;
    border-bottom: 1px solid #e9ecef;
  }
`;

const ExpandableRow = styled.tr`
  cursor: pointer;

  &:hover {
    background: #f8f9fa;
  }
`;

const ScoreCell = styled.td<{ $value: number | null }>`
  font-weight: 700;
  color: ${({ $value }) =>
    $value === null
      ? "#6c757d"
      : $value < -0.5
        ? "var(--error-failure-100)"
        : $value > 0.5
          ? "var(--error-success-100)"
          : "inherit"};
`;

const ReceivedEval = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem;
  margin: 0.4rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
`;

const PlotWrapper = styled.div`
  max-width: 480px;
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
          stroke="#e9ecef"
        />
        <line
          x1={pad}
          y1={size - scale(0)}
          x2={size - pad}
          y2={size - scale(0)}
          stroke="#e9ecef"
        />
        <text x={size - pad} y={size - scale(0) - 6} fontSize="10" textAnchor="end" fill="#6c757d">
          contribution →
        </text>
        <text x={scale(0) + 6} y={pad + 4} fontSize="10" fill="#6c757d">
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
              fill="#495057"
            >
              {report.name.split(" ")[0]}
            </text>
          </g>
        ))}
      </svg>
    </PlotWrapper>
  );
};

const PeerEvalReport = ({
  reports,
}: {
  reports: PeerEvalStudentReport[];
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (reports.length === 0) {
    return <MutedText>No students are assigned to teams yet.</MutedText>;
  }

  return (
    <Card>
      <SectionTitle>Peer evaluation report</SectionTitle>
      <MutedText>
        Averages of the scores each student received from their teammates
        (−2 to +2). Click a row to read the individual evaluations.
      </MutedText>
      <ScatterPlot reports={reports} />
      <Table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Team</th>
            <th>Contribution</th>
            <th>Teamwork</th>
            <th>Received</th>
            <th>Given</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
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
                <td>{report.receivedCount}</td>
                <td>{report.givenCount}</td>
              </ExpandableRow>
              {expanded === report.userId && (
                <tr>
                  <td colSpan={6}>
                    {report.received.length === 0 && (
                      <MutedText>No evaluations received yet.</MutedText>
                    )}
                    {report.received.map((evaluation, index) => (
                      <ReceivedEval key={index}>
                        <strong>{evaluation.evaluatorName}</strong>
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
          ))}
        </tbody>
      </Table>
    </Card>
  );
};

export const TeacherEvaluations = ({
  details,
  reports,
}: {
  details: GroupProjectDetails;
  reports: EvaluationReports | null;
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
              projectId={details.project._id}
              team={selectedTeam}
              existing={details.myTeamEvaluations[selectedTeam._id] || []}
            />
          )}
        </>
      )}

      {reports && <PeerEvalReport reports={reports.peerEvals} />}

      {reports && reports.teamEvals.some((team) => team.entries.length > 0) && (
        <Card>
          <SectionTitle>Team evaluation results</SectionTitle>
          {reports.teamEvals
            .filter((team) => team.entries.length > 0)
            .map((team) => (
              <div key={team.teamId}>
                <SectionTitle as="h3" style={{ fontSize: "0.95rem" }}>
                  {team.teamName}
                </SectionTitle>
                <ChipRow style={{ margin: "0.5rem 0" }}>
                  {Object.entries(team.categories).map(([category, bucket]) => (
                    <Pill key={category}>
                      {EVALUATION_CATEGORY_LABELS[
                        category as EvaluationCategory
                      ] || category}
                      : {bucket.avg} avg ({bucket.count})
                    </Pill>
                  ))}
                </ChipRow>
                {team.entries
                  .filter((entry) => entry.comment)
                  .map((entry, index) => (
                    <ReceivedEval key={index}>
                      <span>
                        <strong>{entry.evaluatorName}</strong>
                        {entry.evaluatorIsTeacher && " (teacher)"} —{" "}
                        {EVALUATION_CATEGORY_LABELS[
                          entry.category as EvaluationCategory
                        ] || entry.category}
                        : {entry.score}/10
                      </span>
                      <span>{entry.comment}</span>
                    </ReceivedEval>
                  ))}
              </div>
            ))}
        </Card>
      )}
    </Layout>
  );
};
