import styled from "styled-components";
import Link from "next/link";

export const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const InfoWrapper = styled.div<{ $style?: StatusStyle }>`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--theme-module3-100);
  align-items: center;
  gap: 16px;
  width: 190px;
  height: 160px;
  border-radius: 8px 8px 0 0;
  overflow: hidden;

  ${(props) => props.$style && styleMap[props.$style]}
`;

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding-top: 25px;
`;

export const GuideNr = styled.h2`
  font-size: 16px;
  font-weight: 600;
`;

export const Name = styled.p`
  font-size: 12px;
  width: 155px;
  text-align: center;
`;

export enum StatusStyle {
  grey = "grey",
  normal = "normal",
  green = "green",
  red = "red",
  blue = "blue",
  star = "star",
}

const styleMap = {
  [StatusStyle.grey]: `
  background-color: var(--primary-black-10);
  &:hover {
    background-color: var(--primary-black-10);
    color: var(--primary-black-100);
  }
`,
  [StatusStyle.normal]: `
  background-color: white;
  &:hover {
    background-color: var(--primary-black-10);
    color: var(--primary-black-100);
  }
`,
  [StatusStyle.green]: `
  background-color: var(--error-success-100);
  &:hover {
    background-color: var(--error-success-60);
  }
`,
  [StatusStyle.red]: `
  background-color: var(--error-failure-100);
  color: var(--primary-white);
  &:hover {
    background-color: var(--error-failure-60);
    color: var(--primary-white);
  }
`,
  [StatusStyle.star]: `
  background-color: var(--theme-module3-100);
  color: var(--primary-white);
  &:hover {
    background-color: var(--theme-module3-60);
    color: var(--primary-white);
  }
`,
  [StatusStyle.blue]: `
  background-color: var(--error-notification-100);
  color: var(--primary-white);
  &:hover {
    background-color: var(--error-notification-60);
    color: var(--primary-white);
  }
`,
};

export const StatusWrapper = styled.div<{
  $style: StatusStyle;
  $curvedBottom?: boolean;
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--theme-module3-100);
  width: 190px;
  height: 50px;
  overflow: hidden;
  ${(props) => (props.$curvedBottom ? "border-radius:0 0 8px 8px;" : "")}
  ${(props) => styleMap[props.$style]}
`;

export const Status = styled.h3<{ $style: StatusStyle }>`
  font-size: 12px;
  padding: 10px;
  font-weight: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  width: 100%;
`;

export const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  width: 100%;
  height: 100%;

  &:hover {
    background-color: var(--primary-black-10);
  }
`;
