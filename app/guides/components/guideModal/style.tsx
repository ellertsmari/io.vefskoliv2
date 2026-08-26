import { StyleColors } from "globalStyles/colors";
import { Wrapper } from "globalStyles/globalStyles";
import styled from "styled-components";

export const ColouredCircle = styled.div<{ $backgroundColor?: StyleColors }>`
  border-radius: 50%;
  ${(props) => `background-color: ${props.$backgroundColor};`}

  /* Was a clamp() whose min and preferred value were identical, paired with a
     px height — a no-op that only obscured that this is a 12px dot. */
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
`;

export const GuideModalWrapper = styled(Wrapper)`
  gap: 1.5rem;
  max-width: 1200px;
  width: 100%;
`;

export const ReturnStatusContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

export const TitleContainer = styled(Wrapper)`
  width: 100%;
`;

/* The wrapper's own gap already separates this from the body; the extra 2rem
   of padding on top of it left a 3.5rem hole under the title. */
export const Header = styled(Wrapper)`
  gap: 1rem;
  width: 100%;
`;

/** Status on the left, "view this guide" on the right. */
export const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;
