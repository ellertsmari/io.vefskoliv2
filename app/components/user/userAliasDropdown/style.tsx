import styled from 'styled-components';

export const DropdownContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

export const DropdownButton = styled.button`
  background: var(--error-success-100);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: bold;
  text-transform: uppercase;
  
  &:hover {
    background: var(--error-success-100);
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
  background: var(--primary-white);
  min-width: 300px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2);
  z-index: 1000;
  border-radius: var(--radius-lg);
  border: 3px solid var(--primary-black-60);
  max-height: 400px;
  overflow-y: auto;
  margin-top: 8px;
`;

export const DropdownItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--primary-black-10);
  color: var(--primary-black-60);
  background: var(--primary-white);
  
  &:hover {
    background-color: var(--primary-black-5);
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
  background: var(--error-warning-100);
  color: white;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  text-align: center;
  margin-bottom: 8px;
  font-weight: bold;
`;

export const ClearAliasButton = styled.button`
  width: 100%;
  background: var(--error-failure-100);
  color: white;
  border: none;
  padding: 12px;
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 2px solid var(--primary-black-10);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  
  &:hover {
    background: var(--error-failure-100);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;