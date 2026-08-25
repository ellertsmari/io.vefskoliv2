import styled from "styled-components";
import { Widget, WidgetTitle } from "UIcomponents/widgetGrid/style";
import { PageContainer } from "globalStyles/pageStyles";

/**
 * Fluid rather than capped at 1200px: the dashboard is a tiling card layout, so
 * a wide screen should buy more guide cards per row instead of a band of empty
 * space down the right-hand side.
 */
export const HomeContainer = styled(PageContainer).attrs({
  $width: "full" as const,
})``;

export {
  WidgetGrid as MainContent,
  WidgetColumn as Column,
  Widget as Section,
  WidgetTitle as SectionTitle,
  WidgetSubtitle as SectionSubtitle,
  WidgetHeader,
} from "UIcomponents/widgetGrid/style";

export const GuidesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;


export const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background: var(--primary-black-10);
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
  margin-top: 0.35rem;
`;

export const ProgressValue = styled.div`
  height: 100%;
  background: var(--error-success-100);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-white);
  font-weight: 600;
  font-size: var(--text-xs);
  transition: width 0.3s ease;
  min-width: 32px;
`;

export const ProgressLabel = styled.label`
  font-weight: 600;
  color: var(--primary-black-100);
  font-size: var(--text-sm);
  display: block;
`;

export const ModuleProgress = styled.div`
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

/* Overall bar, set off from the per-module list under it. */
export const OverallProgress = styled.div`
  padding-bottom: 0.85rem;
  margin-bottom: 0.85rem;
  border-bottom: 1px solid var(--primary-black-10);
`;

export const ProgressGroupLabel = styled(ProgressLabel)`
  margin-bottom: 0.35rem;
`;

export const ModuleProgressBar = styled(ProgressBar)`
  height: 16px;
  margin-top: 0.2rem;
`;

export const ModuleProgressLabel = styled(ProgressLabel)`
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--primary-black-60);
`;

export const ModuleProgressValue = styled(ProgressValue)`
  font-size: var(--text-xs);
  min-width: 28px;
`;

/* One module per row in the status rail; tiles into columns if Grades is ever
   given a wider slot. */
export const GradesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
`;

export const GradeCard = styled.div`
  padding: 0.6rem 0.75rem;
  background: var(--primary-black-5);
  border-radius: var(--radius-md);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.25rem 0.75rem;
`;

export const GradeTitle = styled.h3`
  font-size: var(--text-sm);
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
  font-size: var(--text-xs);
  color: var(--primary-black-60);
`;

export const GradeValue = styled.span`
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-black-100);
`;

export const EmptyState = styled(Widget)`
  background: var(--error-success-10);
  border-color: var(--error-success-30);

  ${WidgetTitle} {
    color: var(--primary-black-100);
  }
`;

/**
 * Holds the "How is this calculated?" trigger. Modal's own trigger wrapper is
 * width/height 100%, so without a fit-content box around it a click anywhere
 * along the header row would open the walkthrough.
 */
export const HowGradingWorksSlot = styled.div`
  width: fit-content;
  max-width: 100%;
  align-self: flex-start;
  margin-top: 0.4rem;
`;

export const HowGradingWorksButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);
  text-decoration: underline;
  cursor: pointer;
  text-align: left;

  &:hover {
    color: var(--primary-black-100);
  }
`;
