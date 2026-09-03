"use client";

import styled from "styled-components";

const Notice = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin: 0 0 0.75rem 0;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--theme-module3-10);
  color: var(--primary-black-100);
  font-size: var(--text-sm);
`;

const Discard = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: var(--theme-module3-100);
  text-decoration: underline;
  cursor: pointer;
`;

/**
 * Tells the user their unsaved typing came back, and lets them throw it away.
 * Rendered only while `restored` is true, so an untouched form shows nothing.
 */
export const DraftNotice = ({
  restored,
  onDiscard,
}: {
  restored: boolean;
  onDiscard: () => void;
}) => {
  if (!restored) return null;
  return (
    <Notice role="status">
      We restored what you had typed here earlier.
      <Discard type="button" onClick={onDiscard}>
        Discard it
      </Discard>
    </Notice>
  );
};
