"use client";
import styled from "styled-components";

export const Container = styled.div`
  position: relative;
  width: 100%;
  padding: 10px;
`;

export const ModuleContainer = styled.div<{
  $zIndex?: number;
}>`
  display: flex;
  gap: 10px;
  width: 100%;
  z-index: ${(props) => props.$zIndex ?? 2};
`;

export const ModuleOptionContainer = styled.button`
  padding: 10px 20px;
  color: #8e92bc;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;

  &:hover {
    color: var(--primary-default);
  }

  &:focus {
    outline: none;
  }

  &.active {
    background-color: #f0f0f0;
  }
`;
export const StyledButton = styled.button`
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;

  &:hover {
    background-color: #0056b3;
  }
`;
