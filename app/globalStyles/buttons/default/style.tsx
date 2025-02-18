import styled from "styled-components";

const BREAKPOINT = "680px";

export const Button = styled.button<{ $styletype: "default" | "outlined" }>`
  background-color: ${(props) =>
    props.$styletype === "default"
      ? "transparent"
      : "#E8F1FC"};
  border: ${(props) =>
    props.$styletype === "default"
      ? "none"
      : "1px solid var(--theme-module3-100)"};
  color: ${(props) =>
    props.$styletype === "default"
      ? "#2B5B76"
      : "var(--theme-module3-100)"};
  
  border-radius: 8px;
  font-size: 12px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.1s ease-in-out;
  width: 110px;

  

  &:hover {
    background-color: ${(props) =>
      props.$styletype === "default"
        ? "#E8F1FC"
        : "transparent"};

    color: ${(props) =>
      props.$styletype ==='default'
      ? "#2B5B76"
      : "#2B5B76"
    
    
    
    }
  }




  @media (min-width: ${BREAKPOINT}) {
    padding: 8px 12px;
    font-size: 16px;
  }
`;
