import styled from 'styled-components';

export const DropdownContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

export const DropdownButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  
  &:hover {
    background: #218838;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const DropdownContent = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: #ffffff;
  min-width: 300px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2);
  z-index: 1000;
  border-radius: 12px;
  border: 3px solid #333333;
  max-height: 400px;
  overflow-y: auto;
  margin-top: 8px;
`;

export const DropdownItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
  color: #333333;
  background: #ffffff;
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  &:last-child {
    border-bottom: none;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
  
  &:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
`;

export const AliasIndicator = styled.div`
  background: #fd7e14;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-align: center;
  margin-bottom: 8px;
  font-weight: bold;
`;

export const ClearAliasButton = styled.button`
  width: 100%;
  background: #dc3545;
  color: white;
  border: none;
  padding: 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 2px solid #e0e0e0;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  
  &:hover {
    background: #c82333;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;