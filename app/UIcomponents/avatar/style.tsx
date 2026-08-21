"use client";
import styled from "styled-components";
import Image from "next/image";

export const AvatarCircle = styled.div<{ $size: number }>`
  /* Positioned so the image can use next/image's fill layout. */
  position: relative;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-black-100);
`;

export const AvatarImage = styled(Image)`
  object-fit: cover;
`;

export const AvatarInitials = styled.span<{ $size: number }>`
  color: var(--primary-white);
  /* Scales with the circle so initials stay optically centred at any size. */
  font-size: ${({ $size }) => Math.round($size * 0.36)}px;
  font-weight: 600;
  line-height: 1;
  user-select: none;
`;
