"use client";
import styled from "styled-components";

export const CardWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;

/**
 * Fills the cell it is given rather than being a fixed 190x200 block. The old
 * fixed size left ~80px of dead space on either side of every card once these
 * were placed in the dashboard's wider grid tracks.
 */
export const InfoWrapper = styled.div<{ $borderStyle: string | undefined }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 190px;
  border: 1px solid var(--primary-black-100);
  border-radius: var(--radius-md);

  position: relative;

  ${(props) => props.$borderStyle}
`;

export const WriteFeedbackContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

export const VotingContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  max-width: 400px;
`;
export const VoteContainer = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;

  &:focus-visible {
    outline: 2px solid var(--primary-black-100);
    outline-offset: 4px;
    border-radius: var(--radius-md);
  }
`;

export const VoteDescription = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  text-align: center;
  line-height: 1.3;
  margin-top: 0.25rem;
`;

export const VoteIcon = styled.div`
  display: flex;
  border-width: 1px;
  border-style: solid;
  border-radius: var(--radius-md);
  width: 100px;
  height: 100px;
  justify-content: center;
  align-items: center;
`;
