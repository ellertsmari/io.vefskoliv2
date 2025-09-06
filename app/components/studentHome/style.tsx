import styled from "styled-components";

export const HomeContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
`;

export const Section = styled.section`
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--primary-white);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--primary-black-10);
`;

export const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-black-100);
  margin-bottom: 0.5rem;
  margin-top: 0;
`;

export const SectionSubtitle = styled.p`
  font-size: 1rem;
  color: var(--primary-black-60);
  margin-bottom: 1.5rem;
  margin-top: 0;
`;

export const ProgressSection = styled(Section)`
  background: linear-gradient(135deg, var(--theme-module3-10) 0%, var(--primary-white) 100%);
  border: 1px solid var(--theme-module3-30);
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 24px;
  background: var(--primary-black-10);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-top: 0.5rem;
`;

export const ProgressValue = styled.div`
  height: 100%;
  background: linear-gradient(90deg, var(--theme-module3-100) 0%, var(--theme-module3-60) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-white);
  font-weight: 600;
  font-size: 14px;
  transition: width 0.3s ease;
  min-width: 40px;
`;

export const ProgressLabel = styled.label`
  font-weight: 600;
  color: var(--primary-black-100);
  font-size: 1rem;
  display: block;
`;

export const ModuleProgress = styled.div`
  margin-bottom: 1rem;
`;

export const ModuleProgressBar = styled(ProgressBar)`
  height: 20px;
  margin-top: 0.25rem;
`;

export const ModuleProgressLabel = styled(ProgressLabel)`
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

export const ModuleProgressValue = styled(ProgressValue)`
  font-size: 12px;
  min-width: 30px;
`;

export const GradeSection = styled(Section)`
  background: linear-gradient(135deg, var(--error-success-10) 0%, var(--primary-white) 100%);
  border: 1px solid var(--error-success-30);
`;

export const GradeCard = styled.div`
  padding: 1.5rem;
  background: var(--primary-white);
  border-radius: 8px;
  border: 1px solid var(--primary-black-10);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const GradeTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-black-100);
  margin: 0 0 0.5rem 0;
  text-align: center;
`;

export const GradeValue = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--theme-module3-100);
  margin-left: 0.5rem;
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
