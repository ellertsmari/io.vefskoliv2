import { Button } from "globalStyles/buttons/default/style";
import styled from "styled-components";

export const SubmitButton = styled(Button)`
  margin-top: 1rem;
  width: 50%;
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const GradeContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.5rem;
`;

export const GradeMeaningDisplay = styled.div`
  margin-bottom: 8px;
  padding: 8px 12px;
  background-color: var(--primary-black-10);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  border: 1px solid var(--primary-black-30);
  line-height: 1.4;
`;

/**
 * Shown in place of the slider when a review has no grade yet. Deliberately
 * looks like an informational note rather than a disabled control — there is
 * nothing here for the student to act on, they are waiting on a teacher.
 */
export const PendingPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
  padding: 12px;
  background-color: var(--primary-black-5);
  border: 1px dashed var(--primary-black-30);
  border-radius: var(--radius-md);
`;

export const PendingTitle = styled.span`
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--primary-black-60);
`;

export const PendingText = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.4;
  color: var(--primary-black-60);

  a {
    color: inherit;
  }
`;
