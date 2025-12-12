import styled from "styled-components";
import { ReturnStatus } from "types/guideTypes";

export const ReportsContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

export const Header = styled.div`
  margin-bottom: 2rem;
`;

export const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #000;
  margin: 0 0 0.5rem 0;
`;

export const Subtitle = styled.p`
  font-size: 1rem;
  color: #6c757d;
  margin: 0;
`;

export const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  align-items: start;
`;

export const StudentsPanel = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
`;

export const StudentsTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 1rem 0;
`;

export const StudentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const StudentItem = styled.button<{ selected: boolean }>`
  background: ${props => props.selected ? '#f8f9fa' : 'transparent'};
  border: 1px solid ${props => props.selected ? '#000' : 'transparent'};
  border-radius: 6px;
  padding: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
    border-color: #6c757d;
  }
`;

export const StudentName = styled.div`
  font-weight: 500;
  color: #000;
  font-size: 0.9rem;
`;

export const StudentEmail = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
`;

export const StudentReportPanel = styled.div`
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 2rem;
`;

export const EmptyState = styled.div`
  text-align: center;
  color: #6c757d;
  padding: 3rem 1rem;
`;

export const ReportTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 1.5rem 0;
`;

export const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #000;
  margin: 2rem 0 1rem 0;
  
  &:first-child {
    margin-top: 0;
  }
`;

export const GuideGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

export const GuideCard = styled.div`
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #007bff;
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
    transform: translateY(-1px);
  }
`;

export const GuideTitle = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  color: #000;
  margin: 0 0 0.5rem 0;
`;

export const GuideStatus = styled.span<{ status: ReturnStatus }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  
  background: ${props => {
    switch (props.status) {
      case ReturnStatus.PASSED:
        return '#d4edda';
      case ReturnStatus.HALL_OF_FAME:
        return '#fff3cd';
      case ReturnStatus.FAILED:
        return '#f8d7da';
      case ReturnStatus.AWAITING_REVIEWS:
        return '#cce5ff';
      default:
        return '#e9ecef';
    }
  }};
  
  color: ${props => {
    switch (props.status) {
      case ReturnStatus.PASSED:
        return '#155724';
      case ReturnStatus.HALL_OF_FAME:
        return '#856404';
      case ReturnStatus.FAILED:
        return '#721c24';
      case ReturnStatus.AWAITING_REVIEWS:
        return '#004085';
      default:
        return '#495057';
    }
  }};
`;

export const GuideDetails = styled.div`
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #6c757d;
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

export const LoadingState = styled.div`
  text-align: center;
  color: #6c757d;
  padding: 2rem;
`;