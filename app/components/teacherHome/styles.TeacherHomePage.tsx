"use client";
import Link from "next/link";
import styled, { css } from "styled-components";

export { PageContainer } from "globalStyles/pageStyles";

/** Small caps heading that groups a band of the page. */
export const GroupLabel = styled.h2`
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary-black-30);
  margin: 0.5rem 0 -0.5rem 0;
`;

/**
 * The grading queue, which is the one thing on this page that can be
 * outstanding. Full width and given a subtitle so it reads as a task rather
 * than another shortcut tile.
 */
export const PrimaryAction = styled.button<{ $waiting: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1.25rem;
  text-align: left;
  cursor: pointer;
  background: ${({ $waiting }) =>
    $waiting ? "var(--theme-module3-10)" : "var(--primary-white)"};
  border: 1px solid
    ${({ $waiting }) =>
      $waiting ? "var(--theme-module3-30)" : "var(--primary-black-10)"};
  border-radius: var(--radius-lg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: var(--theme-module3-100);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

export const PrimaryText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
`;

export const PrimaryTitle = styled.span`
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const PrimarySubtitle = styled.span`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
`;

/* Width and padding come from PageContainer, which wraps this. */
export const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
`;

/**
 * Shortcuts are left-aligned rows rather than centred tiles: they read as a
 * list of destinations, and the icon column lines up down the grid.
 */
const shortcutCard = css`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem;
  text-align: left;
  text-decoration: none;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: var(--primary-black-100);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    border-color: var(--primary-black-10);
    box-shadow: none;
  }
`;

export const ShortcutLink = styled(Link)`
  ${shortcutCard}
`;

export const ShortcutButton = styled.button`
  ${shortcutCard}
`;

export const ActionIcon = styled.span<{ $tone?: "accent" }>`
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: ${({ $tone }) =>
    $tone === "accent" ? "var(--theme-module3-30)" : "var(--primary-black-5)"};
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;
    stroke: ${({ $tone }) =>
      $tone === "accent"
        ? "var(--theme-module3-hover)"
        : "var(--primary-black-100)"};
  }
`;

export const ActionText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
`;

export const ActionTitle = styled.span`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const ActionDescription = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
`;

export const BadgeCount = styled.span`
  flex-shrink: 0;
  background: var(--error-failure-100);
  color: var(--primary-white);
  font-size: var(--text-sm);
  font-weight: 700;
  padding: 0.15rem 0.6rem;
  border-radius: var(--radius-pill);
  min-width: 2rem;
  text-align: center;
`;

export const ErrorText = styled.p`
  font-size: var(--text-sm);
  color: var(--error-failure-100);
  margin: 0;
`;

/* Padding, width and scrolling all come from the modal itself (size="lg"). */
export const GradingModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

export const GradingModalHeader = styled.div`
  margin-bottom: 1.5rem;
`;

export const GradingModalTitle = styled.h2`
  font-size: var(--text-2xl);
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

export const GradingModalSubtitle = styled.p`
  color: var(--primary-black-60);
  margin: 0;
`;

export const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ReviewItem = styled.div`
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 1rem;
`;

export const ReviewItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

export const ReviewItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ReviewGuideTitle = styled.h4`
  font-size: var(--text-base);
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`;

export const ReviewMeta = styled.p`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  margin: 0;
`;

export const ReviewVoteBadge = styled.span<{ $vote: string }>`
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  background: ${props =>
    props.$vote === 'pass' ? 'var(--error-success-30)' :
    props.$vote === 'no pass' ? 'var(--error-failure-30)' :
    'var(--theme-module3-30)'};
  color: ${props =>
    props.$vote === 'pass' ? 'var(--primary-black-100)' :
    props.$vote === 'no pass' ? 'var(--primary-black-100)' :
    'var(--theme-module3-hover)'};
`;

export const ReviewComment = styled.div`
  font-size: var(--text-sm);
  color: var(--primary-black-60);
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--primary-white);
  border-radius: var(--radius-sm);
  max-height: 150px;
  overflow-y: auto;
`;

export const GradeInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const GradeSlider = styled.input`
  flex: 1;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--primary-black-10);
  border-radius: var(--radius-sm);
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: var(--primary-black-100);
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: var(--primary-black-100);
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

export const GradeValue = styled.span`
  font-size: var(--text-lg);
  font-weight: 600;
  min-width: 50px;
  text-align: center;
`;

export const SubmitGradeButton = styled.button`
  background: var(--primary-black-100);
  color: var(--primary-white);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: var(--primary-black-60);
  }

  &:disabled {
    background: var(--primary-black-60);
    cursor: not-allowed;
  }
`;

export const EmptyGradingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--primary-black-60);
`;

export const ProjectLinks = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

export const ProjectLink = styled.a`
  font-size: var(--text-xs);
  color: var(--theme-module3-100);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const GradeErrorText = styled(ErrorText)`
  margin-top: 0.5rem;
`;
