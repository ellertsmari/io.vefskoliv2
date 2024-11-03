import {
  FeedbackStatus,
  GradesGivenStatus,
  ReturnStatus,
} from "types/guideTypes";
import { GuideCardStatuses } from "components/guideCardStatuses/GuideCardStatuses";
import { StyledLink, Info, GuideNr, Name, GuideDescription } from "./style";

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
        <GuideDescription>
          <GuideNr>
            {order ? `GUIDE ${order}` : `MODULE ${moduleTitle}`}
          </GuideNr>
          <Name>{guideTitle}</Name>
        </GuideDescription>
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
