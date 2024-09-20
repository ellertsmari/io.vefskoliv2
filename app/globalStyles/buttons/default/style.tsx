import styled from "styled-components";

const BREAKPOINT = "680px";

export const Button = styled.button<{ $styletype: "default" | "outlined" }>`
  background-color: ${(props) =>
    props.$styletype === "default"
      ? "var(--theme-module3-100)"
      : "transparent"};
  border: ${(props) =>
    props.$styletype === "default"
      ? "none"
      : "1px solid var(--theme-module3-100)"};
  color: ${(props) =>
    props.$styletype === "default"
      ? "var(--primary-white)"
      : "var(--theme-module3-100)"};
  border-radius: 8px;
  font-size: 12px;
  padding: 4px 12px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.1s ease-in-out;

  &:hover {
    background-color: ${(props) =>
      props.$styletype === "default"
        ? "var(--theme-module3-hover)"
        : "var(--primary-black-10)"};
  }

  @media (min-width: ${BREAKPOINT}) {
    padding: 8px 12px;
    font-size: 14px;
  }
`;
