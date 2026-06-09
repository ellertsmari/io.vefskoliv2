"use client";

import styled from "styled-components";
import type { ExerciseAnalytics } from "utils/exerciseUtils";

const Panel = styled.section`
  margin-top: 2rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  background: #fff;
`;

const Title = styled.h2`
  margin: 0 0 0.25rem 0;
  font-size: 1.15rem;
`;

const Summary = styled.p`
  margin: 0 0 1rem 0;
  color: #555;
  font-size: 0.9rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th,
  td {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }

  th {
    font-weight: 600;
    color: #555;
  }
`;

const Rate = styled.span<{ $level: "easy" | "medium" | "hard" | "none" }>`
  font-weight: 600;
  color: ${({ $level }) =>
    $level === "easy"
      ? "#0f5132"
      : $level === "medium"
      ? "#664d03"
      : $level === "hard"
      ? "#842029"
      : "#777"};
`;

const GoalTag = styled.span`
  display: inline-block;
  font-size: 0.75rem;
  color: #555;
  border: 1px solid #ddd;
  border-radius: 999px;
  padding: 0 0.5rem;
  margin-top: 0.25rem;
`;

const rateLevel = (rate: number | null): "easy" | "medium" | "hard" | "none" => {
  if (rate === null) return "none";
  if (rate >= 0.8) return "easy";
  if (rate >= 0.5) return "medium";
  return "hard";
};

const percent = (rate: number | null) =>
  rate === null ? "—" : `${Math.round(rate * 100)}%`;

/**
 * Teacher-facing quiz analytics: how students are doing overall, and which
 * questions they struggle with. A question most students get wrong is either
 * a hard concept (worth more guide material) or a confusing question (worth
 * rewriting) — both are exactly what the teacher wants to spot.
 */
export const ExerciseAnalyticsView = ({
  analytics,
}: {
  analytics: ExerciseAnalytics;
}) => {
  if (analytics.totalAttempts === 0) {
    return (
      <Panel>
        <Title>Exercise analytics</Title>
        <Summary>No attempts yet — analytics appear once students start taking the quiz.</Summary>
      </Panel>
    );
  }

  // hardest first, never-answered last
  const sorted = [...analytics.taskStats].sort((a, b) => {
    if (a.correctRate === null) return 1;
    if (b.correctRate === null) return -1;
    return a.correctRate - b.correctRate;
  });

  return (
    <Panel>
      <Title>Exercise analytics</Title>
      <Summary>
        {analytics.uniqueStudents} student
        {analytics.uniqueStudents === 1 ? "" : "s"} ·{" "}
        {analytics.totalAttempts} attempt
        {analytics.totalAttempts === 1 ? "" : "s"} · pass rate{" "}
        {percent(analytics.studentPassRate)} (by best attempt) · average best
        score {analytics.averageBestScore ?? "—"}/10. Questions sorted hardest
        first — a low correct rate means a hard concept or a confusing
        question; both are worth a look.
      </Summary>
      <Table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Answered</th>
            <th>Fully correct</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => (
            <tr key={task.taskId}>
              <td>
                {task.prompt}
                {task.goal && (
                  <>
                    <br />
                    <GoalTag>{task.goal}</GoalTag>
                  </>
                )}
              </td>
              <td>{task.timesAnswered}×</td>
              <td>
                <Rate $level={rateLevel(task.correctRate)}>
                  {percent(task.correctRate)}
                </Rate>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Panel>
  );
};
