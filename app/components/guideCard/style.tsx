"use client";
import styled from "styled-components";
import { Wrapper } from "globalStyles/input/style";
import { Button } from "globalStyles/buttons/default/style";
import { StyleColors } from "globalStyles/colors";

const BREAKPOINT = "680px";
const BREAKPOINT_DESKTOP = "1024px";

export const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const InfoWrapper = styled.div<{ $borderStyle: string | undefined }>`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--theme-module3-100);
  align-items: center;
  gap: 16px;
  width: 190px;
  height: 200px;
  border-radius: 8px;

  position: relative;

  ${(props) => props.$borderStyle}
`;

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
`;

export const GuideNr = styled.h2`
  font-size: 16px;
  font-weight: 600;
`;

export const Name = styled.p`
  font-size: 12px;
  width: 155px;
  font-weight: 400;
  text-align: center;
`;

export const ReturnStatusContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

export const ModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding-bottom: 32px;
  @media (min-width: ${BREAKPOINT}) {
    flex-direction: row;
  }
`;

export const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const ColouredCircle = styled.div<{ $backgroundColor?: StyleColors }>`
  border-radius: 50%;
  ${(props) => `background-color: ${props.$backgroundColor};`}

  width: 12px;
  height: 12px;

  @media (min-width: ${BREAKPOINT}) {
  width: 16px;
  height: 16px;
`;

export const OverviewWrapper = styled(Wrapper)`
  gap: 32px;
  width: 100%;
`;

export const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Link = styled.a`
  text-decoration: none;
`;

export const ReturnButton = styled(Button)`
  text-align: left;
  padding: 2px 8px;
  white-space: nowrap;
`;

export const ReturnLinksWrapper = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  height: 100%;

  &:hover {
    background-color: var(--primary-black-10);
  }
`;

export const LinkNoWrap = styled(Link)`
  white-space: nowrap;
`;

export const FeedbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 32px;
`;

export const FeedbackInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;

  @media (min-width: ${BREAKPOINT_DESKTOP}) {
    flex-direction: row;
  }
`;

export const WriteFeedbackContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

export const Border = styled.div`
  border: 1px solid var(--theme-module3-100);
  padding: 16px;
  border-radius: 8px;
`;

export const ContentAndNavigatorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

export const ToggleContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

export const VotingContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  max-width: 400px;
`;
export const VoteContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100px;
`;

export const VoteIcon = styled.div`
  display: flex;
  border-width: 1px;
  border-style: solid;
  border-radius: 8px;
  width: 100px;
  height: 100px;
  justify-content: center;
  align-items: center;
`;
