import styled from "styled-components";

const breakPoint = "450px";

/**
 * Modal widths. Content decides the size: a form wants a narrow column, a code
 * exercise or a two-column report needs the room. Without this every modal fell
 * back to 90dvw, which is why they read as mostly whitespace on a wide screen.
 */
export const MODAL_SIZES = {
  sm: "420px", // confirmations, short prompts
  md: "560px", // default: forms, profile
  lg: "820px", // slideshows, attempt reviews
  xl: "1140px", // code exercises, two-column reports
} as const;

export type ModalSize = keyof typeof MODAL_SIZES;

export const ModalWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  top: 0;
  left: 0;
  width: 100dvw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  z-index: 10;

  @media (min-width: ${breakPoint}) {
    align-items: center;
  }
`;

export const ContentWrapper = styled.div<{ $size: ModalSize }>`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: var(--primary-white);
  width: 100%;
  height: 95%;
  gap: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--theme-module3-100);
  z-index: 11;
  max-height: 90dvh;
  /* Extra top padding keeps content clear of the pinned close button. */
  padding: 2.25rem 1.5rem 1.5rem;
  /* The wrapper itself never scrolls, so the close button can stay pinned. */
  overflow: hidden;

  @media (min-width: ${breakPoint}) {
    height: auto;
    width: min(100%, ${({ $size }) => MODAL_SIZES[$size]});
    max-width: 90dvw;
  }

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

/** Pinned to the corner instead of taking a whole row of its own. */
export const ButtonWrapper = styled.div`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 1;
`;

export const Content = styled.div`
  /* Padding lives on ContentWrapper; doubling it here was the whitespace. */
  overflow-y: auto;
  /* Take the leftover height so tall content scrolls instead of being
     clipped by the wrapper's overflow:hidden. */
  flex: 1;
  min-height: 0;
`;
