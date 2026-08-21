import styled from "styled-components";
import { ReturnStatus } from "types/guideTypes";
import { PageContainer } from "globalStyles/pageStyles";

/* Dense tables, so the wide page width. */
export const ReportsContainer = styled(PageContainer).attrs({
  $width: "wide" as const,
})``;

export {
  TitleBlock as Header,
  PageTitle as Title,
  PageSubtitle as Subtitle,
} from "globalStyles/pageStyles";

export const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  align-items: start;
`;

export const StudentsPanel = styled.div`
  background: white;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 1.5rem;
`;

export const StudentsTitle = styled.h2`
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 1rem 0;
`;

export const StudentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const StudentItem = styled.button<{ selected: boolean }>`
  background: ${props => props.selected ? 'var(--primary-black-5)' : 'transparent'};
  border: 1px solid ${props => props.selected ? 'var(--primary-black-100)' : 'transparent'};
  border-radius: var(--radius-md);
  padding: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--primary-black-5);
    border-color: var(--primary-black-60);
  }
`;

export const StudentName = styled.div`
  font-weight: 500;
  color: var(--primary-black-100);
  font-size: var(--text-sm);
`;

export const StudentEmail = styled.div`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  margin-top: 0.25rem;
`;

export const StudentReportPanel = styled.div`
  background: white;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 2rem;
`;

export const EmptyState = styled.div`
  text-align: center;
  color: var(--primary-black-60);
  padding: 3rem 1rem;
`;

export const ReportTitle = styled.h2`
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 1.5rem 0;
`;

export const SectionTitle = styled.h3`
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--primary-black-100);
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
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--theme-module3-100);
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
    transform: translateY(-1px);
  }
`;

export const GuideTitle = styled.h4`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 0.5rem 0;
`;

export const GuideStatus = styled.span<{ status: ReturnStatus }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
  
  background: ${props => {
    switch (props.status) {
      case ReturnStatus.PASSED:
        return 'var(--error-success-30)';
      case ReturnStatus.HALL_OF_FAME:
        return 'var(--error-warning-30)';
      case ReturnStatus.FAILED:
        return 'var(--error-failure-30)';
      case ReturnStatus.AWAITING_REVIEWS:
        return 'var(--theme-module3-30)';
      default:
        return 'var(--primary-black-10)';
    }
  }};
  
  color: ${props => {
    switch (props.status) {
      case ReturnStatus.PASSED:
        return 'var(--primary-black-100)';
      case ReturnStatus.HALL_OF_FAME:
        return 'var(--primary-black-100)';
      case ReturnStatus.FAILED:
        return 'var(--primary-black-100)';
      case ReturnStatus.AWAITING_REVIEWS:
        return 'var(--theme-module3-hover)';
      default:
        return 'var(--primary-black-60)';
    }
  }};
`;

export const GuideDetails = styled.div`
  margin-top: 0.75rem;
  font-size: var(--text-xs);
  color: var(--primary-black-60);
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

export const LoadingState = styled.div`
  text-align: center;
  color: var(--primary-black-60);
  padding: 2rem;
`;