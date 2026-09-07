"use client";
import { useState } from "react";
import { useFormDraft } from "utils/hooks/useStorage";
import { DraftNotice } from "UIcomponents/draftNotice/DraftNotice";
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
  SubmittedNote,
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
  flex-wrap: wrap;
`;

/**
 * Eleven buttons, 0 to 10, instead of a slider. A slider had to start
 * somewhere, and it started at 5 — so a row nobody touched still went in as a
 * score. A button row has an honest "not scored yet" state, and each number is
 * a target you can hit on a phone during a presentation.
 */
const Scale = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const ScaleButton = styled.button<{ $color: string; $selected: boolean }>`
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.4rem;
  border-radius: var(--radius-md);
  border: 1px solid
    ${({ $selected, $color }) => ($selected ? $color : "var(--primary-black-10)")};
  background: ${({ $selected, $color }) =>
    $selected ? $color : "var(--primary-white)"};
  color: ${({ $selected }) =>
    $selected ? "var(--primary-white)" : "var(--primary-black-60)"};
  font-size: var(--text-sm);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color 0.1s ease, border-color 0.1s ease,
    color 0.1s ease;

  &:hover {
    border-color: ${({ $color }) => $color};
    color: ${({ $selected, $color }) =>
      $selected ? "var(--primary-white)" : $color};
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
  }
`;

const ScoreValue = styled.span`
  font-weight: 700;
  min-width: 3.5rem;
  font-variant-numeric: tabular-nums;
`;

const Legend = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

/** What the numbers mean, so a 6 from one student is a 6 from the next. */
const SCALE_ANCHORS = [
  ["0–3", "needs work"],
  ["4–6", "solid"],
  ["7–8", "strong"],
  ["9–10", "outstanding"],
] as const;

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
  /** Called after a successful save — e.g. to move on to the next team. */
  onSubmitted?: () => void;
  /** Where unsaved scores and comments are kept between visits. */
  draftKey?: string;
};

const SCORES = Array.from(
  { length: EVALUATION_MAX_SCORE - EVALUATION_MIN_SCORE + 1 },
  (_, index) => EVALUATION_MIN_SCORE + index
);

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
  onSubmitted,
  draftKey,
}: Props) => {
  const router = useRouter();
  const requiredKeys = requiredRubricKeys(rubric, focus);
  const alreadySubmitted = existing.length > 0;

  const [categories, setCategories] = useState<Record<string, CategoryState>>(
    () =>
      Object.fromEntries(
        rubric.map((item) => {
          const entry = existing.find((e) => e.category === item.key);
          // Every row starts unscored — required ones show the scale and wait
          // for a tap; optional ones wait behind "+ Add score".
          return [
            item.key,
            { score: entry?.score ?? null, comment: entry?.comment ?? "" },
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
  const draft = useFormDraft(
    draftKey ?? null,
    { categories, overallComment },
    (saved) => {
      setCategories(saved.categories);
      setOverallComment(saved.overallComment);
    }
  );

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
  const unscored = rubric.filter(
    (item) => requiredKeys.has(item.key) && categories[item.key]?.score == null
  );
  const ready = hasComment && unscored.length === 0;

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
      text: result.success
        ? alreadySubmitted
          ? "Changes saved"
          : "Evaluation submitted!"
        : result.message,
      error: !result.success,
    });
    if (result.success) {
      draft.clear();
      router.refresh();
      onSubmitted?.();
    }
  };

  return (
    <Card as="form" onSubmit={handleSubmit}>
      <SectionTitle>{heading}</SectionTitle>
      {alreadySubmitted && (
        <SubmittedNote role="status">
          ✓ Submitted. You can change your scores until the evaluation closes.
        </SubmittedNote>
      )}
      <DraftNotice restored={draft.restored} onDiscard={draft.discard} />
      <MutedText>
        Score each row from {EVALUATION_MIN_SCORE} to {EVALUATION_MAX_SCORE},
        and write at least one comment. Comments are what the team reads
        afterwards.
      </MutedText>
      <Legend aria-label="What the scores mean">
        {SCALE_ANCHORS.map(([range, meaning]) => (
          <span key={range}>
            <strong>{range}</strong> {meaning}
          </span>
        ))}
      </Legend>
      {rubric.map((item) => {
        const meta = DISCIPLINE_META[item.discipline ?? "general"];
        const entry = categories[item.key] ?? EMPTY_CATEGORY;
        const optional = !requiredKeys.has(item.key);
        // Optional rows stay out of the way until asked for.
        const collapsed = optional && entry.score === null;
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
            {collapsed ? (
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
                  <Scale role="radiogroup" aria-label={`${item.title} score`}>
                    {SCORES.map((score) => (
                      <ScaleButton
                        key={score}
                        type="button"
                        role="radio"
                        aria-checked={entry.score === score}
                        $color={meta.color}
                        $selected={entry.score === score}
                        onClick={() => updateCategory(item.key, { score })}
                      >
                        {score}
                      </ScaleButton>
                    ))}
                  </Scale>
                  <ScoreValue>
                    {entry.score === null
                      ? "Not scored"
                      : `${entry.score}/${EVALUATION_MAX_SCORE}`}
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
        <PrimaryButton type="submit" disabled={saving || !ready}>
          {saving
            ? "Saving…"
            : alreadySubmitted
              ? "Save changes"
              : "Submit evaluation"}
        </PrimaryButton>
        {unscored.length > 0 && (
          <MutedText>
            {unscored.length === 1
              ? `Score “${unscored[0].title}” to continue.`
              : `${unscored.length} rows still need a score.`}
          </MutedText>
        )}
        {unscored.length === 0 && !hasComment && (
          <MutedText>
            Write at least one comment — under a score or in the overall
            comment box.
          </MutedText>
        )}
        {feedback && <Message $error={feedback.error}>{feedback.text}</Message>}
      </Footer>
    </Card>
  );
};
