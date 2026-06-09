import {
  ReviewStatus,
  ReturnStatus,
} from "types/guideTypes";
import { GuideCardStatuses } from "../guideCardStatuses/GuideCardStatuses";
import {
  Info,
  GuideDescription,
  GuideNr,
  Name,
  GuideCardContainer,
  StyledLink,
  ActionHint,
} from "./style";

export const GuideCardOverview = ({
  guideTitle,
  moduleTitle,
  order,
  link,
  returnStatus,
  reviewStatus,
  grade,
}: {
  guideTitle: string;
  moduleTitle: string;
  order?: number;
  link?: string;
  returnStatus: ReturnStatus;
  reviewStatus: ReviewStatus;
  grade?: number;
}) => {
  const content = (
    <Info>
      <GuideDescription>
        <GuideNr>
          {order ? `GUIDE ${order}` : `MODULE ${moduleTitle}`}
        </GuideNr>
        <Name>{guideTitle}</Name>
      </GuideDescription>
      <GuideCardStatuses
        returnStatus={returnStatus}
        reviewStatus={reviewStatus}
        grade={grade}
      />
      {/* same-looking cards behave differently (open guide vs. status modal);
          a small hint removes the guesswork */}
      <ActionHint aria-hidden="true">
        {link ? "Open guide ›" : "View status ›"}
      </ActionHint>
    </Info>
  );

  return link ? (
    <StyledLink href={link} passHref style={{ textDecoration: "none" }}>
      {content}
    </StyledLink>
  ) : (
    <GuideCardContainer>
      {content}
    </GuideCardContainer>
  );
};
