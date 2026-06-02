import styled from "styled-components";

export const Button = styled.button`
  background-color: var(--primary-black-60);
  border: transparent;
  border-radius: 50%;
  font-size: 24px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.1s ease-in-out;

  &:hover {
    background-color: var(--error-failure-100);
  }
`;
