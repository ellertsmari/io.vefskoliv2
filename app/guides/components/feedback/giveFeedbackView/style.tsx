import { FlexibleWrapper } from "globalStyles/globalStyles";
import styled from "styled-components";

/**
 * Wraps rather than squeezes. The row/column switch it inherits is keyed to the
 * viewport, but these columns live inside a modal — on a 1300px screen the
 * viewport says "row" while the modal is only 1140px wide, and the editor was
 * being crushed to fit beside a vote column that refused to shrink. Wrapping
 * lets the editor drop onto its own full-width line when the two no longer fit.
 */
export const FeedbackInfoContainer = styled(FlexibleWrapper)`
  gap: 2rem;
  align-items: flex-start;
  flex-wrap: wrap;
`;

/** Vote and return details: happy to be narrow, capped so it never sprawls. */
export const ReturnDetailsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 1 18rem;
  min-width: 0;
  max-width: 24rem;
`;
