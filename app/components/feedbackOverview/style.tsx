"use client";
import { FlexibleWrapper, Wrapper } from "globalStyles/globalStyles";
import styled from "styled-components";

export const FeedbackContainer = styled(Wrapper)`
  justify-content: center;
  gap: 2rem;
`;

export const FeedbackInfoContainer = styled(FlexibleWrapper)`
  gap: 2rem;
`;

export const ContentAndNavigatorContainer = styled(Wrapper)`
  align-items: center;
  gap: 1rem;
  width: 100%;
`;

export const ToggleContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

export const CommentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
`;
