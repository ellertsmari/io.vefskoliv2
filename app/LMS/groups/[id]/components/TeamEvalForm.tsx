"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { TeamEvaluationEntry } from "types/groupTypes";
import {
  DISCIPLINE_META,
  EVALUATION_MAX_SCORE,
  EVALUATION_MIN_SCORE,
  JudgeFocus,
  OVERALL_CATEGORY,
  RubricItem,
  requiredRubricKeys,
} from "constants/groupWork";
import type { ActionResult } from "utils/errors";
import {
  Card,
  SectionTitle,
  MutedText,
  TextArea,
  PrimaryButton,
  SecondaryButton,
  Message,
  ScorePill,
} from "../../styles";

const CategoryBlock = styled.div<{ $color: string }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0 1rem 0.75rem;
  border-left: 4px solid ${({ $color }) => $color};
  border-bottom: 1px solid var(--primary-black-10);

  &:last-of-type {
    border-bottom: none;
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Slider = styled.input<{ $color: string }>`
  flex: 1;
  accent-color: ${({ $color }) => $color};
`;

const ScoreValue = styled.span`
  font-weight: 700;
  min-width: 3.5rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

type CategoryState = { score: number | null; comment: string };

const EMPTY_CATEGORY: CategoryState = { score: null, comment: "" };

export type TeamEvalSubmission = {
  entries: { category: string; score: number; comment: string }[];
  overallComment: string;
};

type Props = {
  heading: string;
  rubric: RubricItem[];
  existing: TeamEvaluationEntry[];
  /** Judges with a design/code focus may skip the other discipline. */
  focus?: JudgeFocus;
  onSubmit: (data: TeamEvalSubmission) => Promise<ActionResult<void>>;
};

/**
 * One evaluation form for one team. Render with a `key` per team so the
 * state resets when switching teams.
 */
export const TeamEvalForm = ({
  heading,
  rubric,
  existing,
  focus = "all",
  onSubmit,
}: Props) => {
  const router = useRouter();
  const requiredKeys = requiredRubricKeys(rubric, focus);

  const [categories, setCategories] = useState<Record<string, CategoryState>>(
    () =>
      Object.fromEntries(
        rubric.map((item) => {
          const entry = existing.find((e) => e.category === item.key);
          return [
            item.key,
            {
              // optional categories start unscored unless previously scored
              score: entry?.score ?? (requiredKeys.has(item.key) ? 5 : null),
              comment: entry?.comment ?? "",
            },
          ];
        })
      )
  );
  const [overallComment, setOverallComment] = useState(
    () => existing.find((e) => e.category === OVERALL_CATEGORY)?.comment ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const updateCategory = (key: string, patch: Partial<CategoryState>) => {
    setCategories((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? EMPTY_CATEGORY), ...patch },
    }));
  };

  const hasComment =
    overallComment.trim().length > 0 ||
    Object.values(categories).some(
      (entry) => entry.comment.trim().length > 0
    );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    const result = await onSubmit({
      entries: rubric
        .filter((item) => categories[item.key]?.score != null)
        .map((item) => ({
          category: item.key,
          score: categories[item.key].score!,
          comment: categories[item.key].comment,
        })),
      overallComment,
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
      <SectionTitle>{heading}</SectionTitle>
      <MutedText>
        Score each category from {EVALUATION_MIN_SCORE} to{" "}
        {EVALUATION_MAX_SCORE}. You can come back and adjust your scores while
        the evaluation is open.
      </MutedText>
      {rubric.map((item) => {
        const meta = DISCIPLINE_META[item.discipline ?? "general"];
        const entry = categories[item.key] ?? EMPTY_CATEGORY;
        const optional = !requiredKeys.has(item.key);
        return (
          <CategoryBlock key={item.key} $color={meta.color}>
            <CategoryHeader>
              <SectionTitle as="h3" style={{ fontSize: "var(--text-base)", margin: 0 }}>
                {item.title}
              </SectionTitle>
              <ScorePill $color={meta.color} $background={meta.background}>
                {meta.label}
              </ScorePill>
              {optional && <MutedText>optional for you</MutedText>}
            </CategoryHeader>
            {item.description && <MutedText>{item.description}</MutedText>}
            {entry.score === null ? (
              <div>
                <SecondaryButton
                  type="button"
                  onClick={() => updateCategory(item.key, { score: 5 })}
                >
                  + Add score
                </SecondaryButton>
              </div>
            ) : (
              <>
                <ScoreRow>
                  <Slider
                    type="range"
                    min={EVALUATION_MIN_SCORE}
                    max={EVALUATION_MAX_SCORE}
                    value={entry.score}
                    $color={meta.color}
                    aria-label={`${item.title} score`}
                    onChange={(event) =>
                      updateCategory(item.key, {
                        score: parseInt(event.target.value),
                      })
                    }
                  />
                  <ScoreValue>
                    {entry.score}/{EVALUATION_MAX_SCORE}
                  </ScoreValue>
                  {optional && (
                    <SecondaryButton
                      type="button"
                      onClick={() =>
                        updateCategory(item.key, { score: null, comment: "" })
                      }
                    >
                      Skip
                    </SecondaryButton>
                  )}
                </ScoreRow>
                <TextArea
                  value={entry.comment}
                  placeholder="Optional comment…"
                  style={{ minHeight: "60px" }}
                  onChange={(event) =>
                    updateCategory(item.key, { comment: event.target.value })
                  }
                />
              </>
            )}
          </CategoryBlock>
        );
      })}

      <SectionTitle as="h3" style={{ fontSize: "var(--text-base)" }}>
        Overall comment
      </SectionTitle>
      <TextArea
        value={overallComment}
        placeholder="Anything that applies to the whole presentation or project…"
        style={{ minHeight: "80px" }}
        onChange={(event) => setOverallComment(event.target.value)}
      />

      <Footer>
        <PrimaryButton type="submit" disabled={saving || !hasComment}>
          {saving ? "Submitting…" : "Submit evaluation"}
        </PrimaryButton>
        {!hasComment && (
          <MutedText>
            Write at least one comment — under a grade or in the overall
            comment box.
          </MutedText>
        )}
        {feedback && <Message $error={feedback.error}>{feedback.text}</Message>}
      </Footer>
    </Card>
  );
};
