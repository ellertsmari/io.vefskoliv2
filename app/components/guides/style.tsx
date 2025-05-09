"use client";
import styled from "styled-components";

const breakPoint = "768px";

export const Container = styled.div`
  position: relative;
  width: 100%;
  padding: 5px;
`;

export const GuideDropdownContainer = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

export const ModuleOptionContainer = styled.button<{ isActive: boolean }>`
  padding: 10px 20px;
  color: #8e92bc;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: none;
  position: relative;

  &:hover {
    color: var(--primary-default);
  }

  &:focus {
    outline: none;
  }

  ${({ isActive }) =>
    isActive
      ? `
        color: var(--primary-default);
        font-weight: bold;
        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: var(--primary-default);
        }
      `
      : ""}
`;
