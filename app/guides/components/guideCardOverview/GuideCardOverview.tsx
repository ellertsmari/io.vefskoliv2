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
  const Content = () => {
    return (
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
      </Info>
    );
  };

  return link ? (
    <StyledLink href={link} passHref style={{ textDecoration: "none" }}>
      <Content />
    </StyledLink>
  ) : (
    <GuideCardContainer>
      <Content />
    </GuideCardContainer>
  );
};
