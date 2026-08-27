import styled from "styled-components";
import {
  Widget,
  WidgetTitle,
  WidgetHelpButton,
} from "UIcomponents/widgetGrid/style";
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
  WidgetRow as StatusRow,
  WidgetRow as WorkRow,
  Widget as Section,
  WidgetTitle as SectionTitle,
  WidgetSubtitle as SectionSubtitle,
  WidgetHeader,
  WidgetHeaderText,
  WidgetIcon,
} from "UIcomponents/widgetGrid/style";

export { WidgetHeading } from "UIcomponents/widgetGrid/WidgetHeading";

export const GuidesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;


/**
 * A thin rule rather than a chunky bar, and purple rather than green: green is
 * the app's "passed" colour (guide cards, the status legend), so a green
 * progress bar read as a verdict on the student instead of a measure of how
 * far through they are.
 */
export const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: var(--primary-black-10);
  border-radius: var(--radius-pill);
  overflow: hidden;
`;

export const ProgressFill = styled.div`
  height: 100%;
  background: var(--theme-module3-100);
  border-radius: var(--radius-pill);
  transition: width 0.3s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** Label on the left, the number on the right, the bar underneath. */
export const ProgressRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
`;

export const ProgressLabel = styled.span`
  font-weight: 600;
  color: var(--primary-black-100);
  font-size: var(--text-sm);
`;

/**
 * The number used to sit inside the coloured fill with a 32px minimum width,
 * which meant a module at 0% still showed a coloured stub — the widget claimed
 * progress that did not exist. Out here it can tell the truth.
 */
export const ProgressAmount = styled.span`
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
`;

/**
 * Tiles across the widget now that Progress sits in a full-width row rather
 * than a narrow rail — six modules stacked vertically made the summary row as
 * tall as the work below it.
 */
export const ModuleProgressList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.6rem 1.25rem;
`;

export const ModuleProgress = styled.div`
  min-width: 0;
`;

/* Overall bar, set off from the per-module list under it. */
export const OverallProgress = styled.div`
  padding-bottom: 0.85rem;
  margin-bottom: 0.85rem;
  border-bottom: 1px solid var(--primary-black-10);
`;

export const ProgressGroupLabel = styled.span`
  display: block;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--primary-black-30);
  margin-bottom: 0.6rem;
`;

export const ModuleProgressBar = styled(ProgressBar)`
  height: 6px;
`;

export const ModuleProgressLabel = styled(ProgressLabel)`
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--primary-black-100);
`;

export const GradesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.5rem;
`;

/**
 * A bordered white row like every other nested surface in the app, rather than
 * a grey slab — the widget it sits in is already white, so a filled grey block
 * inside it was the only element of its kind on the page.
 */
export const GradeCard = styled.div`
  padding: 0.6rem 0.75rem;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
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
  gap: 0.85rem;
`;

/** Label above value, so the two numbers read as a pair of small statistics. */
export const GradeItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
`;

export const GradeLabel = styled.span`
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-black-30);
`;

export const GradeValue = styled.span`
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--primary-black-100);
  font-variant-numeric: tabular-nums;
`;

// ── Score ─────────────────────────────────────────────────────────────────
//
// The points system doesn't exist yet. What this widget shows today are counts
// that are genuinely derivable from the guides the student has returned — it
// deliberately does not invent a score, because a number here that changed the
// moment real scoring shipped would be worse than no number at all.

export const ScoreStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.5rem;
`;

export const StatTile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.6rem 0.75rem;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
`;

export const StatValue = styled.span`
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: 1.1;
  color: var(--primary-black-100);
  font-variant-numeric: tabular-nums;
`;

export const StatLabel = styled.span`
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary-black-30);
`;

export const LeaderboardSlot = styled.div`
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--primary-black-10);
`;

export const LeaderboardNote = styled.p`
  margin: 0.35rem 0 0 0;
  font-size: var(--text-xs);
  color: var(--primary-black-60);
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
  flex-shrink: 0;
`;

/**
 * The one explanation that stays on screen, so it is built from the same
 * button as the widgets' question marks — same border, colour and hover — just
 * stretched into a pill to fit its label. Extending the component rather than
 * copying its rules means the two can't drift apart.
 */
export const HowGradingWorksButton = styled(WidgetHelpButton)`
  width: auto;
  height: 1.75rem;
  gap: 0.4rem;
  padding: 0 0.75rem;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--primary-black-60);
  white-space: nowrap;
`;
