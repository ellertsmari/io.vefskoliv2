"use client";
import styled, { css } from "styled-components";
import Link from "next/link";
import { GroupProjectStatus } from "constants/groupWork";

// Shared styled primitives for the group-work pages, matching the
// card aesthetic used on the dashboard (white cards, var(--primary-black-10) borders).

// Page frame now comes from the shared chrome in globalStyles/pageStyles.
export {
  PageContainer,
  PageHeader,
  PageTitle,
} from "globalStyles/pageStyles";

export const SectionTitle = styled.h2`
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
`;

export const MutedText = styled.p`
  color: var(--primary-black-60);
  margin: 0;
  font-size: var(--text-sm);
`;

export const Card = styled.div`
  background: white;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

export const ClickableCard = styled(Link)`
  background: white;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-black-100);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const statusColors: Record<GroupProjectStatus, { bg: string; fg: string }> = {
  formation: { bg: "var(--theme-module3-100)", fg: "white" },
  active: { bg: "var(--error-success-100)", fg: "white" },
  archived: { bg: "var(--primary-black-10)", fg: "var(--primary-black-60)" },
};

export const StatusChip = styled.span<{ $status: GroupProjectStatus }>`
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-lg);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ $status }) => statusColors[$status].bg};
  color: ${({ $status }) => statusColors[$status].fg};
`;

export const Pill = styled.span`
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  color: var(--primary-black-60);
`;

// A Pill tinted by the discipline of the rubric category it shows
// (coding / design / general — the docs' rubric color coding).
export const ScorePill = styled(Pill)<{ $color: string; $background: string }>`
  color: ${({ $color }) => $color};
  background: ${({ $background }) => $background};
  /* color-mix rather than an appended hex alpha, which would silently break
     if DISCIPLINE_META ever moves to CSS variables. */
  border-color: ${({ $color }) =>
    `color-mix(in srgb, ${$color} 20%, transparent)`};
`;

export const buttonBase = css`
  border-radius: var(--radius-md);
  padding: 0.6rem 1.25rem;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled.button`
  ${buttonBase}
  background: var(--primary-black-100);
  color: white;

  &:hover:not(:disabled) {
    background: var(--primary-black-60);
  }
`;

export const SecondaryButton = styled.button`
  ${buttonBase}
  background: white;
  color: var(--primary-black-100);
  border-color: var(--primary-black-10);

  &:hover:not(:disabled) {
    border-color: var(--primary-black-100);
  }
`;

export const DangerButton = styled.button`
  ${buttonBase}
  background: white;
  color: var(--error-failure-100);
  border-color: var(--error-failure-100);

  &:hover:not(:disabled) {
    background: var(--error-failure-100);
    color: white;
  }
`;

export const TabBar = styled.div`
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--primary-black-10);
  overflow-x: auto;
`;

export const TabButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  border-bottom: 3px solid
    ${({ $active }) => ($active ? "var(--primary-black-100)" : "transparent")};
  padding: 0.75rem 1rem;
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ $active }) => ($active ? "var(--primary-black-100)" : "var(--primary-black-60)")};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: var(--primary-black-100);
  }
`;

export const Label = styled.label`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-60);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const Input = styled.input`
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.75rem;
  font-size: var(--text-sm);
  font-family: inherit;
  width: 100%;

  &:focus {
    outline: none;
    border-color: var(--primary-black-100);
  }
`;

export const TextArea = styled.textarea`
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.75rem;
  font-size: var(--text-sm);
  font-family: inherit;
  width: 100%;
  min-height: 110px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--primary-black-100);
  }
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const SelectableChip = styled.button<{ $selected: boolean }>`
  ${buttonBase}
  padding: 0.4rem 0.9rem;
  font-size: var(--text-sm);
  background: ${({ $selected }) => ($selected ? "var(--primary-black-100)" : "white")};
  color: ${({ $selected }) => ($selected ? "white" : "var(--primary-black-60)")};
  border-color: ${({ $selected }) => ($selected ? "var(--primary-black-100)" : "var(--primary-black-10)")};

  &:hover:not(:disabled) {
    border-color: var(--primary-black-100);
  }
`;

export const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 1rem;
`;

export const StatCard = styled.div`
  background: white;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  padding: 1rem;
  text-align: center;
`;

export const StatValue = styled.div`
  font-size: var(--text-2xl);
  font-weight: 700;
`;

export const StatLabel = styled.div`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const Message = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: var(--text-sm);
  color: ${({ $error }) =>
    $error ? "var(--error-failure-100)" : "var(--error-success-100)"};
`;

export const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
`;

export const Avatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--primary-black-5);
`;

export const AvatarFallback = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--primary-black-60);
`;

export const LinksRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const ExternalLink = styled.a`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-100);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 0.3rem 0.6rem;
  text-decoration: none;

  &:hover {
    border-color: var(--primary-black-100);
  }
`;

export const ImagesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const TeamImage = styled.img`
  width: 110px;
  height: 75px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--primary-black-10);
`;
