"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { SerializedTeam, TeamEvaluationEntry } from "types/groupTypes";
import {
  EVALUATION_CATEGORIES,
  EVALUATION_CATEGORY_LABELS,
  EVALUATION_MAX_SCORE,
  EVALUATION_MIN_SCORE,
} from "constants/groupWork";
import { submitTeamEvaluation } from "serverActions/groups/submitTeamEvaluation";
import {
  Card,
  SectionTitle,
  MutedText,
  TextArea,
  PrimaryButton,
  Message,
} from "../../styles";

const CategoryBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;

  &:last-of-type {
    border-bottom: none;
  }
`;

const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Slider = styled.input`
  flex: 1;
  accent-color: #000;
`;

const ScoreValue = styled.span`
  font-weight: 700;
  min-width: 3.5rem;
  text-align: right;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

type CategoryState = { score: number; comment: string };

export const TeamEvalForm = ({
  projectId,
  team,
  existing,
}: {
  projectId: string;
  team: SerializedTeam;
  existing: TeamEvaluationEntry[];
}) => {
  const router = useRouter();

  const initialState = () =>
    Object.fromEntries(
      EVALUATION_CATEGORIES.map((category) => {
        const entry = existing.find((e) => e.category === category);
        return [
          category,
          { score: entry?.score ?? 5, comment: entry?.comment ?? "" },
        ];
      })
    ) as Record<string, CategoryState>;

  const [state, setState] = useState<Record<string, CategoryState>>(
    initialState
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  // Reset the form when switching between teams.
  useEffect(() => {
    setState(initialState());
    setFeedback(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team._id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    const result = await submitTeamEvaluation({
      projectId,
      teamId: team._id,
      entries: EVALUATION_CATEGORIES.map((category) => ({
        category,
        score: state[category].score,
        comment: state[category].comment,
      })),
    });
    setSaving(false);
    setFeedback({
      text: result.success ? "Evaluation submitted!" : result.message,
      error: !result.success,
    });
    if (result.success) router.refresh();
  };

  return (
    <Card as="form" onSubmit={handleSubmit}>
      <SectionTitle>Evaluate {team.name}</SectionTitle>
      <MutedText>
        Score each category from {EVALUATION_MIN_SCORE} to{" "}
        {EVALUATION_MAX_SCORE}. You can come back and adjust your scores while
        the evaluation is open.
      </MutedText>
      {EVALUATION_CATEGORIES.map((category) => (
        <CategoryBlock key={category}>
          <SectionTitle as="h3" style={{ fontSize: "0.95rem" }}>
            {EVALUATION_CATEGORY_LABELS[category]}
          </SectionTitle>
          <ScoreRow>
            <Slider
              type="range"
              min={EVALUATION_MIN_SCORE}
              max={EVALUATION_MAX_SCORE}
              value={state[category].score}
              aria-label={`${EVALUATION_CATEGORY_LABELS[category]} score`}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  [category]: {
                    ...prev[category],
                    score: parseInt(event.target.value),
                  },
                }))
              }
            />
            <ScoreValue>
              {state[category].score}/{EVALUATION_MAX_SCORE}
            </ScoreValue>
          </ScoreRow>
          <TextArea
            value={state[category].comment}
            placeholder="Optional comment…"
            style={{ minHeight: "60px" }}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                [category]: { ...prev[category], comment: event.target.value },
              }))
            }
          />
        </CategoryBlock>
      ))}
      <Footer>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Submitting…" : "Submit evaluation"}
        </PrimaryButton>
        {feedback && <Message $error={feedback.error}>{feedback.text}</Message>}
      </Footer>
    </Card>
  );
};
