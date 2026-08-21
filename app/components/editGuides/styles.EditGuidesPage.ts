import styled from "styled-components";

export {
  PageContainer,
  TitleBlock as Header,
  PageTitle as Title,
} from "globalStyles/pageStyles";

export const SearchContainer = styled.div`
  margin-bottom: 1.5rem;
`;

export const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 0.75rem 1rem;
  border: 2px solid var(--primary-black-30);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  
  &:focus {
    outline: none;
    border-color: var(--theme-module3-100);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

export const FilterSelect = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid var(--primary-black-30);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: white;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: var(--theme-module3-100);
  }
`;

export const GuidesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
`;

export const GuideCard = styled.div`
  background: white;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

export const GuideTitle = styled.h3`
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 0.75rem 0;
`;

export const GuideDescription = styled.p`
  color: var(--primary-black-60);
  font-size: var(--text-sm);
  line-height: 1.5;
  margin: 0 0 1rem 0;
`;

export const GuideActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

interface ActionButtonProps {
  $variant: 'primary' | 'danger';
}

export const ActionButton = styled.button<ActionButtonProps>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' && `
    background: var(--theme-module3-100);
    color: white;
    
    &:hover {
      background: var(--theme-module3-100);
    }
  `}
  
  ${props => props.$variant === 'danger' && `
    background: var(--error-failure-100);
    color: white;
    
    &:hover {
      background: var(--error-failure-100);
    }
  `}
  
  &:active {
    transform: scale(0.98);
  }
`;