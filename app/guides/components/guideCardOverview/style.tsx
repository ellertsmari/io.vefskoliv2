import { Wrapper } from "globalStyles/globalStyles";
import Link from "next/link";
import styled, { css } from "styled-components";

/**
 * Both card shells behave identically; only the element differs. There is no
 * hover background here any more — the card itself lifts, and a grey wash on
 * top of a tinted status surface muddied the colour it was trying to show.
 */
const cardSurface = css`
  text-decoration: none;
  color: inherit;
  display: flex;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-lg);

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
  }
`;

export const GuideCardContainer = styled.div`
  ${cardSurface}
`;

export const StyledLink = styled(Link)`
  ${cardSurface}
`;

/**
 * Padding on all four sides. This used to be `1.25rem 0`, with the horizontal
 * inset faked by fixed 155px widths on the title and the status list — which
 * stopped working the moment the card was allowed to grow.
 */
export const Info = styled(Wrapper)`
  width: 100%;
  height: 100%;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
`;

/**
 * The guide number is context; the title is the thing. These were the other way
 * round — a 16px "GUIDE 5" over a 12px title — so the least useful line on the
 * card was the loudest.
 */
export const GuideNr = styled.h2`
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--primary-black-60);
`;

export const Name = styled.p`
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.35;
  color: var(--primary-black-100);
`;

export const GuideDescription = styled(Wrapper)`
  flex: 1;
  justify-content: center;
  align-items: stretch;
  gap: 0.25rem;
  text-align: center;
`;

export const ActionHint = styled.span`
  font-size: var(--text-xs);
  color: var(--primary-black-60);
  align-self: center;
  white-space: nowrap;
`;
