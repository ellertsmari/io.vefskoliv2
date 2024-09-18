import { ModalProvider } from "components/modal/ModalProvider";
import { useState } from "react";
import {
  ReturnStatus,
  type ExtendedGuideInfo,
  FeedbackStatus,
  GradesGivenStatus,
  GradesReceivedStatus,
} from "../../guides/types";
import { StatusWrapper, Status, StatusStyle } from "./style";

export const Statuses = ({ guide }: { guide: ExtendedGuideInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ModalProvider state={[isModalOpen, setIsModalOpen]}>
      {ReturnStatusContainer(guide.returnStatus)}
      {NotificationOrGradeContainer(guide)}
    </ModalProvider>
  );
};

interface StatusContainerProps {
  info: string;
  style: StatusStyle;
  curvedBottom?: boolean;
}

const StatusContainer = ({
  info,
  style,
  curvedBottom,
}: StatusContainerProps) => {
  return (
    <StatusWrapper $style={style} $curvedBottom={curvedBottom}>
      <Status $style={style}>{info}</Status>
    </StatusWrapper>
  );
};

const ReturnStatusContainer = (returnStatus: ReturnStatus) => {
  return StatusContainer({
    info: returnStatus.toString(),
    style: getReturnStatusStyle(returnStatus),
    curvedBottom: returnStatus === ReturnStatus.NOT_RETURNED,
  });
};

const getReturnStatusStyle = (returnStatus: ReturnStatus) => {
  switch (returnStatus) {
    case ReturnStatus.PASSED:
      return StatusStyle.green;

    case ReturnStatus.FAILED:
      return StatusStyle.red;

    case ReturnStatus.HALL_OF_FAME:
      return StatusStyle.star;

    default:
      return StatusStyle.normal;
  }
};

const NotificationOrGradeContainer = (guide: ExtendedGuideInfo) => {
  const styling = getNotificationOrGradeStyle(guide);

  if (!styling) {
    return null;
  }
  return StatusContainer({
    ...styling,
    curvedBottom: true,
  });
};

const getNotificationOrGradeStyle = (
  guide: ExtendedGuideInfo
): { info: string; style: StatusStyle } | null => {
  const {
    returnStatus,
    feedbackStatus,
    gradesReceivedStatus,
    gradesGivenStatus,
    grade,
  } = guide;
  // if not returned, don't show anything
  // if (returnStatus === ReturnStatus.NOT_RETURNED) {
  //   return null;
  // }

  // notify if action needs to be taken first
  if (gradesGivenStatus === GradesGivenStatus.NEED_TO_GRADE) {
    return {
      info: gradesGivenStatus.toString(),
      style: StatusStyle.blue,
    };
  }
  if (feedbackStatus === FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK) {
    return {
      info: feedbackStatus.toString(),
      style: StatusStyle.blue,
    };
  }

  // // tell user they are waiting on others
  // if (
  //   feedbackStatus === FeedbackStatus.AWAITING_PROJECTS ||
  //   gradesGivenStatus === GradesGivenStatus.AWAITING_FEEDBACK ||
  //   gradesReceivedStatus === GradesReceivedStatus.AWAITING_GRADES
  // ) {
  //   return {
  //     info: "Waiting on others",
  //     style: StatusStyle.grey,
  //   };
  // }

  // show grade if all is done
  if (gradesReceivedStatus === GradesReceivedStatus.GRADES_RECEIVED) {
    return {
      info: "Grade: " + grade,
      style:
        returnStatus === ReturnStatus.HALL_OF_FAME
          ? StatusStyle.star
          : StatusStyle.green,
    };
  }

  return null;
};

export const exportForTesting = {
  ReturnStatusContainer,
  NotificationOrGradeContainer,
};
