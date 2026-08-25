"use client";
import styled from "styled-components";

/**
 * A grid, not flex-wrap: the cards size themselves to their cell now, so
 * wrapping would give each one a whole row. Tracks also mean even gutters
 * instead of space-around's uneven ones on a partly-filled last row.
 */
export const GuideContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
  width: 100%;
`;
