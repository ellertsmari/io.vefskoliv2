"use client";

import styled from "styled-components";

export const RunnerShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: min(48rem, 92vw);
  max-height: 80vh;
`;

export const RunnerHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const RunnerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

export const RunnerFooter = styled.footer`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
`;

export const Spacer = styled.div`
  flex: 1;
`;

export const Prompt = styled.h3`
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.4;

  /* Focused on each new question so a keyboard user lands on the question
     rather than at the top of the modal, but without a focus ring on click. */
  &:focus {
    outline: none;
  }
  &:focus-visible {
    outline: 2px solid #6563eb;
    outline-offset: 4px;
  }
`;

export const Feedback = styled.p<{ $tone: "right" | "wrong" }>`
  margin: 0.25rem 0 0 0;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: ${({ $tone }) => ($tone === "right" ? "#0f5132" : "#842029")};
  background: ${({ $tone }) => ($tone === "right" ? "#d1e7dd" : "#f8d7da")};
`;

export const ScoreBig = styled.p`
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
`;

export const GoalList = styled.ul`
  list-style: none;
  margin: 0.5rem 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.9rem;
`;

export const GoalRow = styled.li<{ $mastered: boolean }>`
  color: ${({ $mastered }) => ($mastered ? "#0f5132" : "#664d03")};
`;
