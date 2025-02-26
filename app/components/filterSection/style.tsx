"use client";

import styled from "styled-components";

export const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid #ddd;
  gap: 20px;
`;

export const ModuleList = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  span {
    font-size: 24px;
    font-weight: bold;
    color: black;
  }
`;

export const ModuleItem = styled.button<{ selected: boolean }>`
  font-size: 14px;
  color: ${({ selected }) => (selected ? "#4F46E5" : "black")};
  background: none;
  border: none;
  cursor: pointer;
  position: relative;

  &:after {
    content: "";
    display: ${({ selected }) => (selected ? "block" : "none")};
    width: 4px;
    height: 4px;
    background: #4f46e5;
    border-radius: 50%;
    position: absolute;
    left: 50%;
    bottom: -6px;
    transform: translateX(-50%);
  }
`;

export const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 10px;
  background: #fafafa;
  flex-grow: 1;
  max-width: 300px;
`;

export const SearchInput = styled.input`
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
  flex: 1;
`;

export const SearchButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #808080;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  background: white;

  &:hover {
    background: #f3f3f3;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;
