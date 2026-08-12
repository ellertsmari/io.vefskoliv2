"use client";

import { useState, useTransition } from "react";
import styled from "styled-components";
import {
  promoteShortAnswer,
  type TaskReview,
} from "serverActions/shortAnswerReview";

/**
 * Short answers the key did not accept, with a one-click way to accept one.
 *
 * Held ("close") answers come first — those are near misses the grader
 * deliberately refused to mark wrong. The rest are shown too, because the
 * genuinely interesting case is a correct phrasing nobody anticipated, which
 * looks no different from a wrong answer until a human reads it.
 */

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

const Question = styled.div`
  margin-bottom: 1.5rem;
`;

const Prompt = styled.h3`
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
`;

const Accepted = styled.p`
  margin: 0 0 0.5rem 0;
  color: #555;
  font-size: 0.85rem;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
`;

const Answer = styled.code`
  flex: 1;
  word-break: break-word;
`;

const Tag = styled.span<{ $pending: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ $pending }) => ($pending ? "#664d03" : "#555")};
  background: ${({ $pending }) => ($pending ? "#fff3cd" : "#f1f1f1")};
`;

const Count = styled.span`
  color: #777;
  white-space: nowrap;
`;

const AcceptButton = styled.button`
  padding: 0.3rem 0.75rem;
  border: 1px solid #0f5132;
  border-radius: 6px;
  background: #fff;
  color: #0f5132;
  cursor: pointer;
  font-size: 0.85rem;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const Note = styled.p`
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: #0f5132;
`;

export const ShortAnswerReviewPanel = ({
  guideId,
  reviews,
}: {
  guideId: string;
  reviews: TaskReview[];
}) => {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  // Accepted in this session — hidden immediately so the list reflects the click
  // without waiting for a round trip.
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const withAnswers = reviews.filter((r) => r.answers.length > 0);
  if (withAnswers.length === 0) return null;

  const pendingTotal = withAnswers.reduce(
    (sum, r) => sum + r.answers.filter((a) => a.status === "pending").length,
    0
  );

  const accept = (taskId: string, answer: string) => {
    setAccepted((prev) => new Set(prev).add(`${taskId}::${answer}`));
    startTransition(async () => {
      const result = await promoteShortAnswer({ guideId, taskId, answer });
      setNote(result.message ?? null);
      if (!result.success) {
        // Put it back so the teacher can see it failed and retry.
        setAccepted((prev) => {
          const next = new Set(prev);
          next.delete(`${taskId}::${answer}`);
          return next;
        });
      }
    });
  };

  return (
    <Panel>
      <Title>Short answers to review</Title>
      <Summary>
        {pendingTotal > 0
          ? `${pendingTotal} answer${
              pendingTotal === 1 ? " is" : "s are"
            } being held as close to correct, and score nothing until you decide. `
          : ""}
        Accepting an answer adds it to that question&apos;s key and re-grades
        every student who wrote it.
      </Summary>

      {withAnswers.map((review) => (
        <Question key={review.taskId}>
          <Prompt>{review.prompt}</Prompt>
          <Accepted>
            Currently accepted: {review.acceptedAnswers.join(", ") || "none"}
          </Accepted>
          {review.answers
            .filter((a) => !accepted.has(`${review.taskId}::${a.answer}`))
            .map((a) => (
              <Row key={a.answer}>
                <Tag $pending={a.status === "pending"}>
                  {a.status === "pending" ? "held" : "marked wrong"}
                </Tag>
                <Answer>{a.answer}</Answer>
                <Count>
                  {a.count} student{a.count === 1 ? "" : "s"}
                </Count>
                <AcceptButton
                  type="button"
                  disabled={isPending}
                  onClick={() => accept(review.taskId, a.answer)}
                >
                  Accept
                </AcceptButton>
              </Row>
            ))}
        </Question>
      ))}

      {note && <Note>{note}</Note>}
    </Panel>
  );
};
