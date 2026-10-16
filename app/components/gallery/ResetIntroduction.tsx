"use client";

import type { ReactNode } from "react";
import styled from "styled-components";

const Anchor = styled.div`
  position: relative;
  display: flex;
  > button { width: 100%; }
`;

export default function ResetIntroduction({ children }: { children: ReactNode }) {
  return <Anchor data-gallery-layout="clear">{children}</Anchor>;
}
