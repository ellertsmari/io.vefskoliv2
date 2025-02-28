"use client"
import styled from "styled-components";

export const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 38px;
  padding: 24px;
`;

export const OverviewContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 24px;
`;

export const LayoutPlanCal = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
`;

export const LayoutToolsandTodo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr; 
  gap: 62px;
  align-items: start;
`;

export const Widgetlayout = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  gap: 62px;
`;


export const SchoolProgressContainer = styled.div`
  margin-top: 24px;
`;

export const BoxContainer = styled.div`
  display: grid;`