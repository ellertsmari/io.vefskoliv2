import styled from "styled-components";

const BREAKPOINT = "680px";

export const Button = styled.button<{ $styletype: "default" | "outlined" }>`
  background-color: ${(props) =>
    props.$styletype === "default"
      ? "var(--primary-black-100)"
      : "transparent"};
  border: ${(props) =>
    props.$styletype === "default"
      ? "none"
      : "1px solid var(--primary-black-100)"};
  color: ${(props) =>
    props.$styletype === "default"
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
        : "var(--primary-black-10)"};
  }

  @media (min-width: ${BREAKPOINT}) {
    padding: 8px 12px;
    font-size: 14px;
  }
`;
