"use client";
import styled from "styled-components";

export const Heading1 = styled.h1`
  font-size: 40px;
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const Heading2 = styled.h2`
  font-size: 32px;
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const SubHeading1 = styled.h3`
  font-size: 24px;
  font-weight: 400;
  color: var(--primary-black-100);
`;

export const SubHeadingLabel = styled.label`
  font-size: 24px;
  font-weight: 400;
  color: var(--primary-black-100);
`;

export const SubHeading1Bold = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const SubHeading2 = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const Paragraph = styled.p`
  font-size: 14px;
  font-weight: 400;
  color: var(--primary-black-100);
`

export const ParagraphBold = styled(Paragraph)`
  font-weight: 700;
`

export const ParagraphItalic = styled(Paragraph)`
  font-size: 12px;
  font-weight: 300;
  font-style: italic;
`

export const ButtonLarge = styled.p`
  font-size: 16px;
  font-weight: 400;
  text-transform: capitalize;
`

export const ButtonMedium = styled(ButtonLarge)`
  font-size: 14px;
`

export const ButtonSmall = styled(ButtonLarge)`
  font-size: 12px;
`
