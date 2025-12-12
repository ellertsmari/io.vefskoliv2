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

export const BadgeCount = styled.span`
  background: #dc3545;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
`;

export const GradingModalWrapper = styled.div`
  padding: 1.5rem;
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
`;

export const GradingModalHeader = styled.div`
  margin-bottom: 1.5rem;
`;

export const GradingModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

export const GradingModalSubtitle = styled.p`
  color: #6c757d;
  margin: 0;
`;

export const ReviewsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ReviewItem = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
`;

export const ReviewItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

export const ReviewItemInfo = styled.div`
  flex: 1;
`;

export const ReviewGuideTitle = styled.h4`
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
`;

export const ReviewMeta = styled.p`
  font-size: 0.8rem;
  color: #6c757d;
  margin: 0;
`;

export const ReviewVoteBadge = styled.span<{ $vote: string }>`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: ${props =>
    props.$vote === 'pass' ? '#d4edda' :
    props.$vote === 'no pass' ? '#f8d7da' :
    '#cce5ff'};
  color: ${props =>
    props.$vote === 'pass' ? '#155724' :
    props.$vote === 'no pass' ? '#721c24' :
    '#004085'};
`;

export const ReviewComment = styled.div`
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
`;

export const GradeInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const GradeSlider = styled.input`
  flex: 1;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: #e9ecef;
  border-radius: 4px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #000;
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #000;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

export const GradeValue = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
`;

export const SubmitGradeButton = styled.button`
  background: #000;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #333;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

export const EmptyGradingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6c757d;
`;

export const ProjectLinks = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

export const ProjectLink = styled.a`
  font-size: 0.75rem;
  color: #007bff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;