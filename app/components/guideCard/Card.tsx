import {
  FeedbackStatus,
  GradesGivenStatus,
  ReturnStatus,
} from "../../guides/types";
import { Statuses } from "../statuses/statuses";
import { StyledLink, Info, GuideNr, Name } from "./style";

export const Card = ({
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
        <Statuses
          returnStatus={returnStatus}
          feedbackStatus={feedbackStatus}
          gradesGivenStatus={gradesGivenStatus}
          grade={grade}
        />
      </Info>
    </StyledLink>
  );
};
