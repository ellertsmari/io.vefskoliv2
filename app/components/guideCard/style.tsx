"use client";
import styled from "styled-components";


const BREAKPOINT = "680px";
const BREAKPOINT_DESKTOP = "1024px";

export const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 50px;
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
