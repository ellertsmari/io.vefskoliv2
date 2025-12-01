"use client";
import styled from "styled-components";

export const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;

  @media (min-width: 768px) {
    padding: 60px 32px;
  }
`;

export const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 48px;
`;

export const PageTitle = styled.h1`
  font-family: "Sunflower", sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-black-100);
  margin: 0 0 16px 0;

  @media (min-width: 768px) {
    font-size: 42px;
  }
`;

export const PageDescription = styled.p`
  font-family: "Source Sans 3", sans-serif;
  font-size: 16px;
  color: var(--primary-black-60);
  margin: 0;
  max-width: 600px;
  margin: 0 auto;

  @media (min-width: 768px) {
    font-size: 18px;
  }
`;
