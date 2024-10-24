"use client";

import { SmallText } from "globalStyles/text";
import styled from "styled-components";

export const StatusesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 155px;
`;

export const Grade = styled(SmallText)<{ $color: string }>`
  font-weight: bold;
  color: ${({ $color }) => $color};
`;

export const Status = styled.div`
  display: flex;
  gap: 12px;
`;

export const IconContainer = styled.div`
  height: 18px;
`;
