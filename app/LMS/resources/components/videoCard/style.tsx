"use client";
import styled from "styled-components";
import Link from "next/link";

export const CardContainer = styled(Link)`
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  color: inherit;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &:hover [data-play-icon] {
    transform: scale(1.1);
    background: var(--primary-blue-100, #2563eb);
  }
`;

export const ThumbnailArea = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const PlayIconWrapper = styled.div.attrs({ 'data-play-icon': true })`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e3a5f;
  transition: transform 0.2s ease, background 0.2s ease;
  padding-left: 4px; /* Optical centering for play icon */

  svg {
    transition: color 0.2s ease;
  }

  ${CardContainer}:hover & {
    color: white;
  }
`;

export const DurationBadge = styled.span`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
`;

export const ModuleBadge = styled.span`
  position: absolute;
  top: 8px;
  left: 8px;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

export const CardContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const CardTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-black-100, #1a1a1a);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const CardMeta = styled.span`
  font-size: 12px;
  color: var(--primary-black-60, #666);
`;
