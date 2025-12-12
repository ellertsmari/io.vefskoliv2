import styled from "styled-components";

export const HomeContainer = styled.div`
  padding: 1.5rem 2rem;
  max-width: 100%;
`;

export const WelcomeHeader = styled.div`
  margin-bottom: 1.5rem;
`;

export const MainContent = styled.div`
  display: flex;
  gap: 2rem;
  align-items: flex-start;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

export const LeftColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const RightColumn = styled.div`
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 900px) {
    width: 100%;
    order: -1;
  }
`;

export const Section = styled.section`
  padding: 1.25rem;
  background: var(--primary-white);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--primary-black-10);
`;

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-black-100);
  margin-bottom: 0.25rem;
  margin-top: 0;
`;

export const SectionSubtitle = styled.p`
  font-size: 0.85rem;
  color: var(--primary-black-60);
  margin-bottom: 1rem;
  margin-top: 0;
`;

export const GuidesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

export const ProgressSection = styled(Section)``;

export const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background: var(--primary-black-10);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  margin-top: 0.35rem;
`;

export const ProgressValue = styled.div`
  height: 100%;
  background: var(--error-success-100);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-white);
  font-weight: 600;
  font-size: 11px;
  transition: width 0.3s ease;
  min-width: 32px;
`;

export const ProgressLabel = styled.label`
  font-weight: 600;
  color: var(--primary-black-100);
  font-size: 0.85rem;
  display: block;
`;

export const ModuleProgress = styled.div`
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ModuleProgressBar = styled(ProgressBar)`
  height: 16px;
  margin-top: 0.2rem;
`;

export const ModuleProgressLabel = styled(ProgressLabel)`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--primary-black-80);
`;

export const ModuleProgressValue = styled(ProgressValue)`
  font-size: 10px;
  min-width: 28px;
`;

export const GradeSection = styled(Section)``;

export const GradesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const GradeCard = styled.div`
  padding: 0.75rem 1rem;
  background: var(--primary-black-5);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const GradeTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0;
`;

export const GradeValues = styled.div`
  display: flex;
  gap: 1rem;
`;

export const GradeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const GradeLabel = styled.span`
  font-size: 0.75rem;
  color: var(--primary-black-60);
`;

export const GradeValue = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const EmptyState = styled(Section)`
  text-align: center;
  background: linear-gradient(135deg, var(--error-success-10) 0%, var(--primary-white) 100%);
  border: 1px solid var(--error-success-30);
  
  ${SectionTitle} {
    color: var(--error-success-100);
    font-size: 2rem;
  }
  
  ${SectionSubtitle} {
    color: var(--error-success-60);
    font-size: 1.1rem;
  }
`;
