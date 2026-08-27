"use client";

import styled from "styled-components";
import { PageContainer } from "globalStyles/pageStyles";

export { TitleBlock, PageTitle, PageSubtitle } from "globalStyles/pageStyles";

/**
 * The shared page frame, which this page had been opting out of with its own
 * padding and no heading at all. Full width because the guide grid tiles —
 * capping it would leave the right-hand side of a wide screen empty.
 */
export const Container = styled(PageContainer).attrs({
  $width: "full" as const,
})``;

export const GuideDropdownContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  /* Left-aligned like the rest of the app; this used to centre itself below
     1191px, which put the filter row out of step with everything under it. */
  justify-content: flex-start;
`;
