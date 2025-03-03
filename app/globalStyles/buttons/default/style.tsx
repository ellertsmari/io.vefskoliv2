import styled from "styled-components";

const BREAKPOINT = "680px";

export const Button = styled.button<{ $styletype: "default" | "outlined" }>`
  background-color: ${(props) =>
    props.$styletype === "default" ? "#FFFFFF" : "#E8F1FC"};
  border: ${(props) =>
    props.$styletype === "default" ? "none" : "1px solid #E8F1FC"};
  color: ${(props) => (props.$styletype === "default" ? "#2b5b76" : "#FFFFFF")};

  border-radius: 8px;
  font-size: 12px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.4s ease, color 0.4s ease; 
  width: 110px;
  height: 40px;

  &:hover {
    background-color: ${(props) =>
      props.$styletype === "default" ? "#E8F1FC" : "transparent"};

    color: ${(props) =>
      props.$styletype === "default" ? "#2B5B76" : "#2B5B76"};
  }

  @media (min-width: ${BREAKPOINT}) {
    padding: 8px 12px;
    font-size: 14px;
  }
`;
