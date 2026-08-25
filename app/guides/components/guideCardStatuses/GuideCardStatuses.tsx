import { Paragraph } from "globalStyles/text";
import {
  ReviewStatus,
  ReturnStatus,
  GradesReceivedStatus,
} from "types/guideTypes";
import {
  Grade,
  GradeNote,
  IconContainer,
  Status,
  StatusesWrapper,
} from "./style";

import { Bell, GreenTick, PurpleStar, RedCross, Hourglass, HatIcon } from "assets/Icons";

/**
 * Why a grade can be "not final": until a guide has all its review grades in,
 * `calculateGrade` shows the 5 points earned for returning (plus whatever
 * partial review points already count). Without this note a provisional 5 is
 * indistinguishable from an earned 5/10 — the single most misread number on
 * the card.
 */
const PROVISIONAL_GRADE_EXPLANATION =
  "This isn't your final grade for the guide. It includes 5 points for returning; the rest comes from the grades your reviews receive.";

export const GuideCardStatuses = ({
  returnStatus,
  reviewStatus,
  grade,
  gradesReceivedStatus,
}: {
  returnStatus: ReturnStatus;
  reviewStatus: ReviewStatus;
  grade?: number;
  gradesReceivedStatus?: GradesReceivedStatus;
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
      <ReviewAndGradeStatus
        grade={grade}
        reviewStatus={reviewStatus}
        gradesReceivedStatus={gradesReceivedStatus}
      />
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
  reviewStatus,
  grade,
  gradesReceivedStatus,
}: {
  reviewStatus: ReviewStatus;
  grade: number | undefined;
  gradesReceivedStatus: GradesReceivedStatus | undefined;
}) => {
  if (reviewStatus === ReviewStatus.NEED_TO_REVIEW) {
    return (
      <Status>
        <IconContainer>
          <Bell />
        </IconContainer>
        <Paragraph>{ReviewStatus.NEED_TO_REVIEW}</Paragraph>
      </Status>
    );
  }

  // `grade != null` rather than a truthiness check: an auto-graded guide can
  // legitimately score 0, and that used to render as no grade at all.
  if (grade != null) {
    const provisional =
      gradesReceivedStatus === GradesReceivedStatus.AWAITING_GRADES;

    return (
      <>
        <Status>
          <IconContainer>
            <HatIcon />
          </IconContainer>
          <Paragraph>GRADE</Paragraph>
          <Grade>{grade}</Grade>
        </Status>
        {provisional && (
          <GradeNote title={PROVISIONAL_GRADE_EXPLANATION}>
            Not final — awaiting review grades
          </GradeNote>
        )}
      </>
    );
  }
  return null;
};
