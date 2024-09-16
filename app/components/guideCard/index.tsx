import {
  CardWrapper,
  Info,
  Name,
  GuideNr,
  StyledLink,
  InfoWrapper,
  StatusStyle,
} from "./style";
import {
  ExtendedGuideInfo,
  FeedbackStatus,
  GradesGivenStatus,
  GradesReceivedStatus,
  ReturnStatus,
} from "../../guides/types";
import { Statuses } from "./Statuses";

const GuideCard = ({
  guide,
  order,
}: {
  guide: ExtendedGuideInfo;
  order?: number;
}) => {
  return (
    <>
      <CardWrapper>
        <InfoWrapper $style={getInfoWrapperStyle(guide)}>
          <StyledLink href={guide.link}>
            <Info>
              <GuideNr>
                {order ? `GUIDE ${order}` : `MODULE ${guide.module.title[0]}`}
              </GuideNr>
              <Name>{guide.title}</Name>
            </Info>
          </StyledLink>
        </InfoWrapper>
        <Statuses guide={guide} />
      </CardWrapper>
    </>
  );
};

const getInfoWrapperStyle = (guide: ExtendedGuideInfo): StatusStyle => {
  const isGradesGiven =
    guide.gradesGivenStatus === GradesGivenStatus.GRADES_GIVEN;
  const isGradesReceived =
    guide.gradesReceivedStatus === GradesReceivedStatus.GRADES_RECEIVED;
  const isFeedbackGiven =
    guide.feedbackStatus === FeedbackStatus.FEEDBACK_GIVEN;

  if (isGradesGiven && isGradesReceived && isFeedbackGiven) {
    if (guide.returnStatus === ReturnStatus.PASSED) {
      return StatusStyle.green;
    } else if (guide.returnStatus === ReturnStatus.HALL_OF_FAME) {
      return StatusStyle.star;
    }
  }

  return StatusStyle.normal;
};

// ...

export const exportForTesting = {
  getInfoWrapperStyle,
};

export default GuideCard;
