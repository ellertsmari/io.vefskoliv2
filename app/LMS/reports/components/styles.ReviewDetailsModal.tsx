import styled from "styled-components";
import { Vote } from "models/review";

/* Width, scrolling and padding are the dialog's job (Modal size="xl"). */
export const ModalWrapper = styled.div`
  width: 100%;
`;

export const ModalContent = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const LeftColumn = styled.div`
  flex: 1;
  min-width: 0;
`;

export const RightColumn = styled.div`
  flex: 0 0 350px;
  
  @media (max-width: 768px) {
    flex: none;
  }
`;

export const ModalHeader = styled.div`
  border-bottom: 1px solid var(--primary-black-10);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
`;

export const ModalTitle = styled.h2`
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 0.5rem 0;
`;

export const ModuleBadge = styled.span`
  display: inline-block;
  background: var(--primary-black-10);
  color: var(--primary-black-60);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-lg);
  font-size: var(--text-xs);
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

export const Section = styled.div`
  margin-bottom: 2rem;
`;

export const SectionTitle = styled.h3`
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 1rem 0;
  border-bottom: 1px solid var(--primary-black-10);
  padding-bottom: 0.5rem;
`;

export const ReviewCard = styled.div`
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
`;

export const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

export const VoteBadge = styled.span<{ vote: Vote }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
  
  background: ${props => {
    switch (props.vote) {
      case Vote.PASS:
        return 'var(--error-success-30)';
      case Vote.RECOMMEND_TO_GALLERY:
        return 'var(--error-warning-30)';
      case Vote.NO_PASS:
        return 'var(--error-failure-30)';
      default:
        return 'var(--primary-black-10)';
    }
  }};
  
  color: ${props => {
    switch (props.vote) {
      case Vote.PASS:
        return 'var(--primary-black-100)';
      case Vote.RECOMMEND_TO_GALLERY:
        return 'var(--primary-black-100)';
      case Vote.NO_PASS:
        return 'var(--primary-black-100)';
      default:
        return 'var(--primary-black-60)';
    }
  }};
`;

export const GradeBadge = styled.span`
  background: var(--theme-module3-100);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  margin-left: 0.5rem;
`;

export const ReviewComment = styled.div`
  background: white;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--primary-black-100);
  white-space: pre-wrap;
`;

export const EmptyState = styled.div`
  text-align: center;
  color: var(--primary-black-60);
  padding: 2rem;
  font-style: italic;
`;

export const ReturnCard = styled.div`
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
`;

export const ReturnHeader = styled.div`
  margin-bottom: 0.75rem;
`;

export const ProjectName = styled.h4`
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 0.5rem 0;
`;

export const LinkRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

export const ProjectLink = styled.a`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--theme-module3-100);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  
  &:hover {
    background: var(--theme-module3-hover);
    color: white;
  }
`;

export const DateInfo = styled.div`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  margin-bottom: 0.75rem;
`;

export const ReturnComment = styled.div`
  background: white;
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  font-size: var(--text-sm);
  line-height: 1.5;
  color: var(--primary-black-100);
  white-space: pre-wrap;
`;

export const GradeAdjustmentContainer = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-sm);
`;

export const GradeAdjustmentHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const GradeAdjustmentTitle = styled.span`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);
  text-transform: uppercase;
`;

export const GradeSlider = styled.input`
  width: 100%;
  height: 4px;
  border-radius: var(--radius-sm);
  background: var(--primary-black-30);
  outline: none;
  margin: 0.5rem 0;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--theme-module3-100);
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--theme-module3-100);
    cursor: pointer;
    border: none;
  }
`;

export const GradeDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

export const GradeValue = styled.span`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const GradeTooltip = styled.div`
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-30);
  color: var(--primary-black-60);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  line-height: 1.3;
  margin: 0.5rem 0;
  font-weight: 500;
`;

export const GradeReferenceChart = styled.div`
  padding: 1rem;
  background: var(--primary-black-5);
  border: 1px solid var(--primary-black-30);
  border-radius: var(--radius-md);
  max-height: 350px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
`;

export const GradeReferenceTitle = styled.h4`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 0.75rem 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const GradeReferenceItem = styled.div<{ isSelected?: boolean }>`
  padding: 0.375rem 0.5rem;
  margin-bottom: 0.25rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  line-height: 1.2;
  background: ${props => props.isSelected ? 'var(--theme-module3-10)' : 'white'};
  border: 1px solid ${props => props.isSelected ? 'var(--theme-module3-100)' : 'var(--primary-black-10)'};
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
`;

export const GradeNumber = styled.span`
  font-weight: 600;
  color: var(--theme-module3-100);
  margin-right: 0.5rem;
`;

export const SaveGradeButton = styled.button`
  background: var(--error-success-100);
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
  
  &:hover:not(:disabled) {
    background: var(--error-success-100);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const EditButton = styled.button`
  background: transparent;
  color: var(--theme-module3-100);
  border: 1px solid var(--theme-module3-100);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  cursor: pointer;
  
  &:hover {
    background: var(--theme-module3-100);
    color: white;
  }
`;
// Uploaded return pictures are inline data URLs — shown as a thumbnail
// instead of a (non-navigable) link.
export const ReturnPicture = styled.img`
  max-width: 160px;
  max-height: 100px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--primary-black-10);
  object-fit: cover;
`;
