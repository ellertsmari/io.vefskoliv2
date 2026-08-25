"use client";

import { ParagraphBold } from "globalStyles/text";
import styled from "styled-components";

/**
 * Sized to its rows and centred as a block, so the icons stay in one column
 * instead of each row centring itself and leaving them ragged. Was a fixed
 * 155px, which no longer matches the card once the card can grow.
 */
export const StatusesWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  flex-direction: column;
  gap: 12px;
  width: fit-content;
  max-width: 100%;
  align-self: center;
`;

export const Grade = styled(ParagraphBold)`
  font-weight: bold;
`;

export const Status = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const IconContainer = styled.div`
  height: 18px;
  width: 18px;
`;
