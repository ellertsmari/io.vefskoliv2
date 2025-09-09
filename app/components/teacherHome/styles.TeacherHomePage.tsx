import styled from "styled-components";

export const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  padding: 2rem;
`;

export const ActionCard = styled.button`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    border-color: #000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const ActionIcon = styled.div`
  width: 48px;
  height: 48px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  
  svg {
    width: 24px;
    height: 24px;
    stroke: #000;
  }
`;

export const ActionTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: #000;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;