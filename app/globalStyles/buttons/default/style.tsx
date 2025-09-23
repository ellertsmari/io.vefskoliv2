import styled from "styled-components";

const BREAKPOINT = "680px";

export const Button = styled.button<{ $styletype: "default" | "outlined" | "defaultWhite" | "outlinedWhite" | "textButton" }>`
  background-color: ${(props) =>
    props.$styletype === "default"
      ? "var(--primary-black-100)"
      : props.$styletype === "defaultWhite"
      ? "var(--primary-white)"
      : props.$styletype === "outlinedWhite"
      ? "var(--primary-white)"
      : props.$styletype === "textButton"
      ? "transparent"
      : "transparent"};
  border: ${(props) =>
    props.$styletype === "default"
      ? "none"
      : props.$styletype === "defaultWhite"
      ? "none"
      : props.$styletype === "outlinedWhite"
      ? "1px solid var(--primary-white)"
      : props.$styletype === "textButton"
      ? "none"
      : "none"};
  color: ${(props) =>
    props.$styletype === "default"
      ? "var(--primary-white)"
      : props.$styletype === "defaultWhite"
      ? "var(--primary-black-100)"
      : props.$styletype === "outlinedWhite"
      ? "var(--primary-black-100)"
      : props.$styletype === "textButton"
      ? "var(--primary-white)"
      : "var(--primary-black-100)"};
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.15s ease-in-out;
  

  &:hover {
    background-color: ${(props) =>
      props.$styletype === "default"
        ? "var(--primary-black-60)"
        : props.$styletype === "defaultWhite"
        ? "var(--primary-black-100)"
        : props.$styletype === "outlinedWhite"
        ? "var(--primary-white)"
        : props.$styletype === "textButton"
        ? "var(--primary-black-100)"
        : "var(--primary-black-10)"};
    color: ${(props) =>
      props.$styletype === "default"
        ? "var(--primary-white)"
        : props.$styletype === "defaultWhite"
        ? "var(--primary-white)"
        : props.$styletype === "outlinedWhite"
        ? "var(--primary-black-100)"
        : props.$styletype === "textButton"
        ? "var(--primary-white)"
        : "var(--primary-black-100)"};
  }

  @media (min-width: ${BREAKPOINT}) {
    padding: 8px 12px;
    font-size: 14px;
  }
`;
