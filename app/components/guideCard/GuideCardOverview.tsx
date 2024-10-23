import {
  FeedbackStatus,
  GradesGivenStatus,
  ReturnStatus,
} from "../../guides/types";
import { GuideCardStatuses } from "../guideCardStatuses/GuideCardStatuses";
import { StyledLink, Info, GuideNr, Name } from "./style";

export const GuideCardOverview = ({
  guideTitle,
  moduleTitle,
  order,
  link,
  returnStatus,
  feedbackStatus,
  grade,
  gradesGivenStatus,
}: {
  guideTitle: string;
  moduleTitle: string;
  order?: number;
  link?: string;
  returnStatus: ReturnStatus;
  feedbackStatus: FeedbackStatus;
  gradesGivenStatus: GradesGivenStatus;
  grade?: number;
}) => {
  return (
    <StyledLink href={link}>
      <Info>
        <GuideNr>{order ? `GUIDE ${order}` : `MODULE ${moduleTitle}`}</GuideNr>
        <Name>{guideTitle}</Name>
        <GuideCardStatuses
          returnStatus={returnStatus}
          feedbackStatus={feedbackStatus}
          gradesGivenStatus={gradesGivenStatus}
          grade={grade}
        />
      </Info>
    </StyledLink>
  );
};