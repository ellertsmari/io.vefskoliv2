import { Wrapper } from "globalStyles/globalStyles";
import Link from "next/link";
import { DesignIcon as Icon } from "assets/Icons";
import { CodeIcon as Icon2 } from "assets/Icons";
import styled from "styled-components";

export const GuideCardContainer = styled.div`
  text-decoration: none;
  color: inherit;
  display: flex;
  justify-content: start;
  align-items: start;
  width: 100%;
  height: 100%;

  &:hover {
    background-color: var(--secondary-light-100);
    border-radius: 20px;
  }
`;

export const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: flex;
  width: 100%;
  height: 100%;

  // background for guide cards//
  &:hover {
    background-color: var(--secondary-light-100);
    border-radius: 20px;
  }
`;

export const Info = styled(Wrapper)`
position:relative
  justify-content: space-between;
  height: 100%;
  align-items: start;
  padding: 1.625rem 1.875rem;
  box-sizing: content-box;
`;

export const GuideNr = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  align-self: start;
  color: var(--secondary-dark);
  margin-top: 0.5rem;
`;

export const Name = styled.p`
  font-size: 0.875rem;
  width: 100%;
  font-weight: 400;
  text-align: start;
  color: var(--secondary-light-300);
`;

export const GuideDescription = styled(Wrapper)``;

export const DesignIcon = styled(Icon)`
  position: absolute;
  top: 0px;
  left: 0px;
  width: 30px;
  height: 28px;
`;
export const CodeIcon = styled(Icon2)`
  position: absolute;
  top: 0px;
  left: 0px;
  width: 30px;
  height: 28px;
`;

export const Tag = styled.div<{ status: string }>`
  position: absolute;
  right: 1.875rem;
  top: 1.625rem;
  width: 5.625rem;
  height: 1.875rem;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  text-transform: capitalize;
  display: flex;
  justify-content: center;
  align-items: center;

  span {
    font-size: 14px;
    font-weight: 500;
    color: ${(props) =>
      props.status === "Due"
        ? "var(--primary-default)"
        : props.status === "Waiting"
        ? "var(--waiting-text)"
        : props.status === "Fail"
        ? "var(--fail-text)"
        : props.status.startsWith("Fail:")
        ? "var(--fail-text)"
        : props.status.startsWith("Pass:")
        ? "var(--pass-text)"
        : props.status === "Pass ✔"
        ? "var(--pass-text)"
        : props.status === "Review"
        ? "var(--grade-text)"
        : props.status === "Grade"
        ? "var(--grade-text)"
        : "var(--primary-default)"};
  }
  background-color: ${(props) =>
    props.status === "Due"
      ? " var(--primary-light-100)"
      : props.status === "Waiting"
      ? "var(--waiting-bg)"
      : props.status.startsWith("Fail:")
      ? "var(--fail-bg)"
      : props.status === "Fail"
      ? "var(--fail-bg)"
      : props.status.startsWith("Pass:")
      ? "var(--pass-bg)"
      : props.status === "Pass ✔"
      ? "var(--pass-bg)"
      : props.status === "Review"
      ? "var(--grade-bg)"
      : props.status === "Grade"
      ? "var(--grade-bg)"
      : "var(--default-color)"};
`;
