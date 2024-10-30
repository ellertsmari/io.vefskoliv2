"use client";
import styled from "styled-components";
import Link from "next/link";
import { Button } from "../../../globalStyles/buttons/default/style";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 32px;
  gap: 32px;
`;

export const Content = styled.div`
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 8fr 3fr;
    grid-template-areas: "main side";
    gap: 42px;
  }
`;

export const Main = styled.div`
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 32px;
`;

export const Side = styled.div`
  grid-area: side;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const Wrapper = styled.div`
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Border = styled(Wrapper)`
  border: 1px solid var(--theme-module3-100);
  padding: 16px;
  border-radius: 8px;
`;

export const styledLink = styled(Link)`
  text-align: left;
`;

export const Requirements = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 3rem;
  padding: 16px;

  @media (min-width: 1024px) {
    flex-direction: row;
  }
`;

export const KnowledgeAndSkills = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const MaterialsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const MaterialButton = styled(Button)`
  text-align: left;
  padding: 2px 8px;
  white-space: nowrap;
`;

export const ReturnWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
`;
