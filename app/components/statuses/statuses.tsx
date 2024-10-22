import { SmallText } from "globalStyles/text";
import {
  FeedbackStatus,
  GradesGivenStatus,
  ReturnStatus,
} from "../../guides/types";
import { Grade, IconContainer, Status, StatusesWrapper } from "./style";

import {
  Bell,
  GreenTick,
  PurpleStar,
  RedCross,
  Hourglass,
} from "../../assets/Icons";


export const Statuses = ({
  returnStatus,
  feedbackStatus,
  gradesGivenStatus,
  grade,
}: {
  returnStatus: ReturnStatus;
  feedbackStatus: FeedbackStatus;
  gradesGivenStatus: GradesGivenStatus;
  grade?: number;
}) => {
  const FeedbackAndGradeStatus = () => {
    if (returnStatus === ReturnStatus.NOT_RETURNED) {
      return null;
    }

    if (gradesGivenStatus === GradesGivenStatus.NEED_TO_GRADE) {
      return (
        <>
          <IconContainer>
            <Bell />
          </IconContainer>
          <SmallText>{GradesGivenStatus.NEED_TO_GRADE}</SmallText>
        </>
      );
    }

    if (feedbackStatus === FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK) {
      return (
        <>
          <IconContainer>
            <Bell />
          </IconContainer>
          <SmallText>{FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK}</SmallText>
        </>
      );
    }

    if (grade) {
      return (
        <>
          <IconContainer>
            <Bell />
          </IconContainer>
          <SmallText>GRADE</SmallText>
          {returnStatus === ReturnStatus.PASSED ? (
            <Grade $color="var(--error-success-100)">{grade}</Grade>
          ) : (
            <Grade $color="var(--theme-module3-100)">{grade}</Grade>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <StatusesWrapper>
      <Status>
        <IconContainer>
          <ReturnStatusIcon returnStatus={returnStatus} />
        </IconContainer>
        {returnStatus !== ReturnStatus.NOT_RETURNED && (
          <SmallText>{returnStatus}</SmallText>
        )}
      </Status>
      <Status>
        <FeedbackAndGradeStatus />
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
    case ReturnStatus.AWAITING_FEEDBACK:
      return <Hourglass />;
    default:
      return null;
  }
};
