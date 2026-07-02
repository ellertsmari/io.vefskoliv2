"use client";
import styled, { css } from "styled-components";
import Link from "next/link";
import { GroupProjectStatus } from "constants/groupWork";

// Shared styled primitives for the group-work pages, matching the
// card aesthetic used on the dashboard (white cards, #e9ecef borders).

export const PageContainer = styled.div`
  max-width: 1200px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 600px) {
    padding: 1rem;
  }
`;

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

export const MutedText = styled.p`
  color: #6c757d;
  margin: 0;
  font-size: 0.9rem;
`;

export const Card = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
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
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;

  &:hover {
    border-color: #000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const statusColors: Record<GroupProjectStatus, { bg: string; fg: string }> = {
  formation: { bg: "var(--theme-module3-100)", fg: "white" },
  active: { bg: "var(--error-success-100)", fg: "white" },
  archived: { bg: "var(--primary-black-10)", fg: "#495057" },
};

export const StatusChip = styled.span<{ $status: GroupProjectStatus }>`
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ $status }) => statusColors[$status].bg};
  color: ${({ $status }) => statusColors[$status].fg};
`;

export const Pill = styled.span`
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  color: #495057;
`;

export const buttonBase = css`
  border-radius: 8px;
  padding: 0.6rem 1.25rem;
  font-size: 0.9rem;
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
  background: #000;
  color: white;

  &:hover:not(:disabled) {
    background: #333;
  }
`;

export const SecondaryButton = styled.button`
  ${buttonBase}
  background: white;
  color: #000;
  border-color: #e9ecef;

  &:hover:not(:disabled) {
    border-color: #000;
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
  border-bottom: 1px solid #e9ecef;
  overflow-x: auto;
`;

export const TabButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  border-bottom: 3px solid
    ${({ $active }) => ($active ? "#000" : "transparent")};
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ $active }) => ($active ? "#000" : "#6c757d")};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: #000;
  }
`;

export const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const Input = styled.input`
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #000;
  }
`;

export const TextArea = styled.textarea`
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  width: 100%;
  min-height: 110px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #000;
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
  font-size: 0.85rem;
  background: ${({ $selected }) => ($selected ? "#000" : "white")};
  color: ${({ $selected }) => ($selected ? "white" : "#495057")};
  border-color: ${({ $selected }) => ($selected ? "#000" : "#e9ecef")};

  &:hover:not(:disabled) {
    border-color: #000;
  }
`;

export const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 1rem;
`;

export const StatCard = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
`;

export const StatValue = styled.div`
  font-size: 1.6rem;
  font-weight: 700;
`;

export const StatLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const Message = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ $error }) =>
    $error ? "var(--error-failure-100)" : "var(--error-success-100)"};
`;

export const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
`;

export const Avatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: #f8f9fa;
`;

export const AvatarFallback = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #6c757d;
`;

export const LinksRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const ExternalLink = styled.a`
  font-size: 0.8rem;
  font-weight: 600;
  color: #000;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  text-decoration: none;

  &:hover {
    border-color: #000;
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
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;
