import styled from "styled-components";
import { Vote } from "models/review";

export const ModalWrapper = styled.div`
  max-width: 1200px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1.5rem;
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
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
`;

export const ModalTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 0.5rem 0;
`;

export const ModuleBadge = styled.span`
  display: inline-block;
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

export const Section = styled.div`
  margin-bottom: 2rem;
`;

export const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 1rem 0;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.5rem;
`;

export const ReviewCard = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
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
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  
  background: ${props => {
    switch (props.vote) {
      case Vote.PASS:
        return '#d4edda';
      case Vote.RECOMMEND_TO_GALLERY:
        return '#fff3cd';
      case Vote.NO_PASS:
        return '#f8d7da';
      default:
        return '#e9ecef';
    }
  }};
  
  color: ${props => {
    switch (props.vote) {
      case Vote.PASS:
        return '#155724';
      case Vote.RECOMMEND_TO_GALLERY:
        return '#856404';
      case Vote.NO_PASS:
        return '#721c24';
      default:
        return '#495057';
    }
  }};
`;

export const GradeBadge = styled.span`
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

export const ReviewComment = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #212529;
  white-space: pre-wrap;
`;

export const EmptyState = styled.div`
  text-align: center;
  color: #6c757d;
  padding: 2rem;
  font-style: italic;
`;

export const ReturnCard = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

export const ReturnHeader = styled.div`
  margin-bottom: 0.75rem;
`;

export const ProjectName = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #000;
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
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  
  &:hover {
    background: #0056b3;
    color: white;
  }
`;

export const DateInfo = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.75rem;
`;

export const ReturnComment = styled.div`
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #212529;
  white-space: pre-wrap;
`;