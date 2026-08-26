import styled from "styled-components";
import { Paragraph } from "globalStyles/text";

/**
 * Fields fill whatever they are put in rather than being a fixed 240/382px.
 * The old widths were set against the viewport, so an input inside a narrow
 * container — a guide's Submit tile, say — kept its desktop width and overflowed.
 * Containers decide the measure now; see AuthForm for the one that needs a cap.
 */
export const ReusableInput = styled.input`
  width: 100%;
  height: 32px;
  padding: 10px;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-md);
  transition: 0.15s ease-in-out;

  &:hover {
    border: 1px solid var(--primary-black-100);
  }

  &:focus {
    outline: none;
    border: 1px solid var(--primary-black-100);
  }
`;

export const ReusableTextarea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 10px;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-md);

  &:hover {
    border: 1px solid var(--theme-module3-60);
  }

  &:focus {
    outline: none;
    border: 1px solid var(--theme-module3-100);
  }
`;

export const Label = styled.label`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
`;

export const ErrorMessage = styled(Paragraph)`
  color: var(--error-failure-100);
  font-size: var(--text-sm);
`;
