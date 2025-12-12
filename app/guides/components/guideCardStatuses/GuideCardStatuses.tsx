import { Paragraph } from "globalStyles/text";
import {
  ReviewStatus,
  GradesGivenStatus,
  ReturnStatus,
} from "types/guideTypes";
import { Grade, IconContainer, Status, StatusesWrapper } from "./style";

import { Bell, GreenTick, PurpleStar, RedCross, Hourglass, HatIcon } from "assets/Icons";

export const GuideCardStatuses = ({
  returnStatus,
  reviewStatus,
  gradesGivenStatus,
  grade,
}: {
  returnStatus: ReturnStatus;
  reviewStatus: ReviewStatus;
  gradesGivenStatus: GradesGivenStatus;
  grade?: number;
}) => {
  if (returnStatus === ReturnStatus.NOT_RETURNED) return null;

  return (
    <StatusesWrapper>
      <Status>
        <IconContainer>
          <ReturnStatusIcon returnStatus={returnStatus} />
        </IconContainer>
        <Paragraph>{returnStatus}</Paragraph>
      </Status>
      <Status>
        <ReviewAndGradeStatus
          returnStatus={returnStatus}
          grade={grade}
          reviewStatus={reviewStatus}
          gradesGivenStatus={gradesGivenStatus}
        />
      </Status>
    </StatusesWrapper>
  );
};

const ReturnStatusIcon = ({ returnStatus }: { returnStatus: ReturnStatus }) => {
  switch (returnStatus) {
    case ReturnStatus.PASSED:
      return <GreenTick />;
    case ReturnStatus.HALL_OF_FAME:
      return <PurpleStar />;
    case ReturnStatus.FAILED:
      return <RedCross />;
    case ReturnStatus.AWAITING_REVIEWS:
      return <Hourglass />;
    default:
      return null;
  }
};

const ReviewAndGradeStatus = ({
  returnStatus,
  gradesGivenStatus,
  reviewStatus,
  grade,
}: {
  returnStatus: ReturnStatus;
  gradesGivenStatus: GradesGivenStatus;
  reviewStatus: ReviewStatus;
  grade: number | undefined;
}) => {
  if (reviewStatus === ReviewStatus.NEED_TO_REVIEW) {
    return (
      <>
        <IconContainer>
          <Bell />
        </IconContainer>
        <Paragraph>{ReviewStatus.NEED_TO_REVIEW}</Paragraph>
      </>
    );
  }

  if (gradesGivenStatus === GradesGivenStatus.NEED_TO_GRADE) {
    return (
      <>
        <IconContainer>
          <Bell />
        </IconContainer>
        <Paragraph>{GradesGivenStatus.NEED_TO_GRADE}</Paragraph>
      </>
    );
  }

  if (grade) {
    return (
      <>
        <IconContainer>
          <HatIcon />
        </IconContainer>
        <Paragraph>GRADE</Paragraph>
        <Grade>{grade}</Grade>
      </>
    );
  }
  return null;
};
